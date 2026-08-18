import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscribeDto, CancelSubscriptionDto } from './dto/subscription.dto.js';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema.js';
import { Plan, PlanDocument } from '../plans/schemas/plan.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getSubscription(userId: string) {
    const sub = await this.subscriptionModel.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (!sub) throw new NotFoundException('No subscription found');
    const plan = await this.planModel.findOne({ id: sub.planId }).lean();
    return { ...sub, plan };
  }

  async getHistory(userId: string) {
    const subs = await this.subscriptionModel.find({ userId }).sort({ createdAt: -1 }).lean();
    const planIds = subs.map((s) => s.planId);
    const plans = await this.planModel.find({ id: { $in: planIds } }).lean();
    const planMap = new Map(plans.map((p: any) => [p.id, p]));
    return subs.map((s: any) => ({ ...s, plan: planMap.get(s.planId) }));
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = await this.planModel.findOne({ id: dto.planId }).lean();
    if (!plan) throw new NotFoundException('Plan not found');

    const existingActive = await this.subscriptionModel.findOne({
      userId,
      status: { $in: ['ACTIVE', 'TRIAL'] },
    });

    if (existingActive) {
      if (existingActive.planId === plan.id) {
        throw new BadRequestException('You are already subscribed to this plan');
      }
      await this.subscriptionModel.findByIdAndUpdate(existingActive._id, {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Upgraded/Downgraded',
      });
    }

    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const created = await this.subscriptionModel.create({
      userId,
      planId: plan.id,
      startDate,
      expiresAt,
      remainingJobCredits: plan.jobCredits ?? 0,
      remainingAiCredits: plan.aiCredits ?? 0,
      remainingResumeCredits: plan.resumeCredits ?? 0,
      remainingAtsCredits: plan.atsCredits ?? 0,
      status: 'ACTIVE',
    } as any);

    return { ...created.toObject(), plan };
  }

  async cancel(userId: string, dto: CancelSubscriptionDto) {
    const sub = await this.subscriptionModel.findOne({
      userId,
      status: { $in: ['ACTIVE', 'TRIAL'] },
    });

    if (!sub) throw new BadRequestException('No active subscription to cancel');

    const updated = await this.subscriptionModel.findByIdAndUpdate(sub._id, {
      autoRenew: false,
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: dto.reason,
    }, { new: true }).lean();

    // Create notification on user document for record
    try {
      const user = await this.userModel.findById(userId).exec();
      if (user) {
        user.notifications = user.notifications || [];
        user.notifications.unshift({
          id: Math.random().toString(36).substring(2, 9),
          title: 'Subscription Cancelled',
          message: `Your subscription has been cancelled. Reason: ${dto.reason || 'Requested by user'}`,
          type: 'INFO',
          link: '/dashboard/subscriptions',
          read: false,
          createdAt: new Date(),
        } as any);
        await user.save();
      }
    } catch (err) {
      // non-blocking
    }

    return updated;
  }

  async renew(userId: string) {
    const sub = await this.subscriptionModel.findOne({ userId }).sort({ createdAt: -1 }).lean();

    if (!sub) throw new BadRequestException('No subscription to renew');

    const plan = await this.planModel.findOne({ id: sub.planId }).lean();
    if (!plan) throw new BadRequestException('Plan not found for renewal');

    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const created = await this.subscriptionModel.create({
      userId,
      planId: sub.planId,
      startDate,
      expiresAt,
      remainingJobCredits: plan.jobCredits ?? 0,
      remainingAiCredits: plan.aiCredits ?? 0,
      remainingResumeCredits: plan.resumeCredits ?? 0,
      remainingAtsCredits: plan.atsCredits ?? 0,
      status: 'ACTIVE',
    } as any);

    return created;
  }
}
