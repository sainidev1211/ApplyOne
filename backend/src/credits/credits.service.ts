import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AddCreditsDto, DeductCreditsDto } from './dto/credit.dto.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async getCredits(userId: string) {
    try {
      const sub = await this.subscriptionsService.getSubscription(userId);
      return {
        remainingJobCredits: sub.remainingJobCredits || 0,
        remainingAiCredits: sub.remainingAiCredits || 0,
        remainingResumeCredits: sub.remainingResumeCredits || 0,
        remainingAtsCredits: sub.remainingAtsCredits || 0,
      };
    } catch (e) {
      return { remainingJobCredits: 0, remainingAiCredits: 0, remainingResumeCredits: 0, remainingAtsCredits: 0 };
    }
  }

  async getHistory(userId: string) {
    return this.prisma.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async deductCredits(dto: DeductCreditsDto) {
    // Update Mongo subscription then create a Postgres creditTransaction for audit
    const sub = await (this.subscriptionsService as any).subscriptionModel.findOne({ userId: dto.userId, status: { $in: ['ACTIVE', 'TRIAL'] } }).sort({ createdAt: -1 }).lean();
    if (!sub) throw new BadRequestException('No active subscription found');

    const featureMap: Record<string, string> = {
      resumeCredits: 'remainingResumeCredits',
      atsCredits: 'remainingAtsCredits',
      aiCredits: 'remainingAiCredits',
      jobCredits: 'remainingJobCredits',
    };

    const dbField = featureMap[dto.feature];
    const currentBalance = (sub as any)[dbField] ?? 0;
    if (currentBalance < dto.amount) throw new BadRequestException(`Insufficient ${dto.feature} credits`);

    await (this.subscriptionsService as any).subscriptionModel.findByIdAndUpdate(sub._id, { $inc: { [dbField]: -dto.amount } });

    await this.prisma.creditTransaction.create({
      data: { userId: dto.userId, feature: dto.feature, creditsBefore: currentBalance, creditsUsed: dto.amount, creditsAfter: currentBalance - dto.amount, reason: dto.reason },
    });

    return { success: true };
  }

  async addCredits(dto: AddCreditsDto) {
    const sub = await (this.subscriptionsService as any).subscriptionModel.findOne({ userId: dto.userId, status: { $in: ['ACTIVE', 'TRIAL'] } }).sort({ createdAt: -1 }).lean();
    if (!sub) throw new BadRequestException('No active subscription found');
    const featureMap: Record<string, string> = {
      resumeCredits: 'remainingResumeCredits',
      atsCredits: 'remainingAtsCredits',
      aiCredits: 'remainingAiCredits',
      jobCredits: 'remainingJobCredits',
    };
    const dbField = featureMap[dto.feature];
    const currentBalance = (sub as any)[dbField] ?? 0;

    await (this.subscriptionsService as any).subscriptionModel.findByIdAndUpdate(sub._id, { $inc: { [dbField]: dto.amount } });

    await this.prisma.creditTransaction.create({ data: { userId: dto.userId, feature: dto.feature, creditsBefore: currentBalance, creditsUsed: -dto.amount, creditsAfter: currentBalance + dto.amount, reason: dto.reason } });

    return { success: true };
  }
}
