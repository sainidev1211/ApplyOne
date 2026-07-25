import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AddCreditsDto, DeductCreditsDto } from './dto/credit.dto.js';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCredits(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] } },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!sub) {
      return {
        remainingJobCredits: 0,
        remainingAiCredits: 0,
        remainingResumeCredits: 0,
        remainingAtsCredits: 0,
      };
    }

    return {
      remainingJobCredits: sub.remainingJobCredits,
      remainingAiCredits: sub.remainingAiCredits,
      remainingResumeCredits: sub.remainingResumeCredits,
      remainingAtsCredits: sub.remainingAtsCredits,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deductCredits(dto: DeductCreditsDto) {
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findFirst({
        where: { userId: dto.userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!sub) throw new BadRequestException('No active subscription found');

      const featureMap = {
        resumeCredits: 'remainingResumeCredits',
        atsCredits: 'remainingAtsCredits',
        aiCredits: 'remainingAiCredits',
        jobCredits: 'remainingJobCredits',
      };

      const dbField = featureMap[dto.feature];
      const currentBalance = (sub as any)[dbField];

      if (currentBalance < dto.amount) {
        throw new BadRequestException(`Insufficient ${dto.feature} credits`);
      }

      const updatedSub = await tx.subscription.update({
        where: { id: sub.id },
        data: {
          [dbField]: { decrement: dto.amount },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: dto.userId,
          feature: dto.feature,
          creditsBefore: currentBalance,
          creditsUsed: dto.amount,
          creditsAfter: currentBalance - dto.amount,
          reason: dto.reason,
        },
      });

      return updatedSub;
    });
  }

  async addCredits(dto: AddCreditsDto) {
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findFirst({
        where: { userId: dto.userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!sub) throw new BadRequestException('No active subscription found');

      const featureMap = {
        resumeCredits: 'remainingResumeCredits',
        atsCredits: 'remainingAtsCredits',
        aiCredits: 'remainingAiCredits',
        jobCredits: 'remainingJobCredits',
      };

      const dbField = featureMap[dto.feature];
      const currentBalance = (sub as any)[dbField];

      const updatedSub = await tx.subscription.update({
        where: { id: sub.id },
        data: {
          [dbField]: { increment: dto.amount },
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: dto.userId,
          feature: dto.feature,
          creditsBefore: currentBalance,
          creditsUsed: -dto.amount,
          creditsAfter: currentBalance + dto.amount,
          reason: dto.reason,
        },
      });

      return updatedSub;
    });
  }
}
