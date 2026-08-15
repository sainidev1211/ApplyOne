import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SubscribeDto, CancelSubscriptionDto } from './dto/subscription.dto.js';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException('No subscription found');
    return sub;
  }

  async getHistory(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
    });

    if (existingActive) {
      if (existingActive.planId === plan.id) {
        throw new BadRequestException(
          'You are already subscribed to this plan',
        );
      }
      // Cancel old subscription
      await this.prisma.subscription.update({
        where: { id: existingActive.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: 'Upgraded/Downgraded',
        },
      });
    }

    const startDate = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        startDate,
        expiresAt,
        remainingJobCredits: plan.jobCredits,
        remainingAiCredits: plan.aiCredits,
        remainingResumeCredits: plan.resumeCredits,
        remainingAtsCredits: plan.atsCredits,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  async cancel(userId: string, dto: CancelSubscriptionDto) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
    });

    if (!sub) throw new BadRequestException('No active subscription to cancel');

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        autoRenew: false,
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason,
      },
    });
  }

  async renew(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (!sub) throw new BadRequestException('No subscription to renew');

    const startDate = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Creates a new cycle
    return this.prisma.subscription.create({
      data: {
        userId,
        planId: sub.planId,
        startDate,
        expiresAt,
        remainingJobCredits: sub.plan.jobCredits,
        remainingAiCredits: sub.plan.aiCredits,
        remainingResumeCredits: sub.plan.resumeCredits,
        remainingAtsCredits: sub.plan.atsCredits,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }
}
