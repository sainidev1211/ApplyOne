import { Injectable, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

@Injectable()
export class FeatureAccessService {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canAccessFeature(
    userId: string,
    feature: 'resumeCredits' | 'atsCredits' | 'aiCredits' | 'jobCredits',
  ) {
    try {
      const sub = await this.subscriptionsService.getSubscription(userId);

      const featureMap = {
        resumeCredits: 'remainingResumeCredits',
        atsCredits: 'remainingAtsCredits',
        aiCredits: 'remainingAiCredits',
        jobCredits: 'remainingJobCredits',
      };

      const dbField = featureMap[feature];
      const remainingCredits = (sub as any)[dbField] ?? 0;

      if (remainingCredits <= 0) {
        return { allowed: false, reason: `Insufficient ${feature} credits`, remainingCredits: 0 };
      }

      return { allowed: true, reason: 'Allowed', remainingCredits };
    } catch (e) {
      return { allowed: false, reason: 'No active subscription found', remainingCredits: 0 };
    }
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

    // Delegate consumption to subscriptions service which manages Mongo state
    // SubscriptionsService does not yet implement decrement + transactionally log creditTransaction in Postgres.
    // For now, update subscription counters in Mongo.
    const featureMap = {
      resumeCredits: 'remainingResumeCredits',
      atsCredits: 'remainingAtsCredits',
      aiCredits: 'remainingAiCredits',
      jobCredits: 'remainingJobCredits',
    };
    const dbField = featureMap[feature] as keyof any;

    const sub = await this.subscriptionsService.getSubscription(userId);
    if (!sub) throw new ForbiddenException('No active subscription found');
    const currentBalance = (sub as any)[dbField] ?? 0;
    if (currentBalance <= 0) throw new ForbiddenException('Insufficient credits');

    // decrement in Mongo
    await (this.subscriptionsService as any).subscriptionModel.findByIdAndUpdate(sub._id, { $inc: { [dbField]: -1 } });

    return { consumed: true };
  }
}
