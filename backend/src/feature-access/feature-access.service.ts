import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class FeatureAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async canAccessFeature(
    userId: string,
    feature: 'resumeCredits' | 'atsCredits' | 'aiCredits' | 'jobCredits',
  ) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      return {
        allowed: false,
        reason: 'No active subscription found',
        remainingCredits: 0,
      };
    }

    const featureMap = {
      resumeCredits: 'remainingResumeCredits',
      atsCredits: 'remainingAtsCredits',
      aiCredits: 'remainingAiCredits',
      jobCredits: 'remainingJobCredits',
    };

    const dbField = featureMap[feature];
    const remainingCredits = (sub as any)[dbField];

    if (remainingCredits <= 0) {
      return {
        allowed: false,
        reason: `Insufficient ${feature} credits`,
        remainingCredits: 0,
      };
    }

    return { allowed: true, reason: 'Allowed', remainingCredits };
  }

  async validateAndConsume(
    userId: string,
    feature: 'resumeCredits' | 'atsCredits' | 'aiCredits' | 'jobCredits',
    reason: string,
  ) {
    const check = await this.canAccessFeature(userId, feature);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    const featureMap = {
      resumeCredits: 'remainingResumeCredits',
      atsCredits: 'remainingAtsCredits',
      aiCredits: 'remainingAiCredits',
      jobCredits: 'remainingJobCredits',
    };

    const dbField = featureMap[feature];

    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) throw new ForbiddenException('No active subscription found');
    const currentBalance = (sub as any)[dbField];

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: sub.id },
        data: { [dbField]: { decrement: 1 } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          feature,
          creditsBefore: currentBalance,
          creditsUsed: 1,
          creditsAfter: currentBalance - 1,
          reason,
        },
      }),
    ]);

    return { consumed: true };
  }
}
