import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { CreatePaymentSessionDto, RefundPaymentDto } from './dto/payment.dto.js';
import { StripeProvider } from './providers/stripe.provider.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { IPaymentProvider } from './interfaces/payment-provider.interface.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { Payment, PaymentDocument } from './schemas/payment.schema.js';
import { Subscription, SubscriptionDocument } from '../subscriptions/schemas/subscription.schema.js';
import { Plan, PlanDocument } from '../plans/schemas/plan.schema.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    private readonly stripeProvider: StripeProvider,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly couponsService: CouponsService,
  ) {}

  private getProvider(method: string): IPaymentProvider {
    if (method === 'STRIPE') return this.stripeProvider;
    if (method === 'RAZORPAY') return this.razorpayProvider;
    throw new BadRequestException('Unsupported payment provider');
  }

  // `user` may be a string id or an object (from JwtStrategy) with id/email/fullName
  async createSession(user: string | { id: string; email?: string; fullName?: string }, dto: CreatePaymentSessionDto) {
    const userId = typeof user === 'string' ? user : user.id;

    // Find plan in Mongo; if missing, do not fallback to creating fake postgres users.
    let plan = await this.planModel.findOne({ id: dto.planId }).lean();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    let finalAmount = Number(plan.monthlyPrice);
    let discountAmount = 0;

    if (dto.couponCode) {
      const validation = await this.couponsService.validateCoupon(userId, {
        code: dto.couponCode,
        planId: plan.id,
        amount: finalAmount,
      });
      discountAmount = validation.discountAmount;
      finalAmount = validation.finalAmount;
    }

    const provider = this.getProvider(dto.provider as unknown as string);

    // Create a pending subscription record in Mongo
    const pendingSubscription = await this.subscriptionModel.create({
      id: randomUUID(),
      userId,
      planId: plan.id,
      startDate: new Date(),
      expiresAt: new Date(),
      autoRenew: true,
      remainingJobCredits: 0,
      remainingAiCredits: 0,
      remainingResumeCredits: 0,
      remainingAtsCredits: 0,
      status: 'PENDING',
    } as any);

    const payment = await this.paymentModel.create({
      id: randomUUID(),
      userId,
      subscriptionId: pendingSubscription._id.toString(),
      planId: plan.id,
      amount: finalAmount,
      currency: plan.currency || 'INR',
      status: 'PENDING',
    } as any);

    const session = await provider.createSession({
      userId,
      planId: plan.id,
      amount: finalAmount,
      currency: plan.currency || 'INR',
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    await this.paymentModel.findByIdAndUpdate(payment._id, { razorpayOrderId: session.sessionId });

    return {
      paymentId: payment._id.toString(),
      ...session,
    };
  }

  async refund(adminId: string, dto: RefundPaymentDto) {
    // Keep existing refund flow with provider; refunds are out-of-scope for Mongo migration here
    throw new BadRequestException('Refunds via admin not implemented for Mongo payments yet');
  }

  async getPayments(userId: string) {
    const payments = await this.paymentModel.find({ userId }).sort({ createdAt: -1 }).lean();
    const subIds = payments.map((p) => p.subscriptionId).filter(Boolean);
    const subs = await this.subscriptionModel.find({ _id: { $in: subIds } }).lean();
    const planIds = payments.map((p) => p.planId).filter(Boolean);
    const plans = await this.planModel.find({ id: { $in: planIds } }).lean();
    const planMap = new Map(plans.map((p: any) => [p.id, p]));
    const subMap = new Map(subs.map((s: any) => [s._id.toString(), s]));
    return payments.map((p: any) => ({ ...p, subscription: subMap.get(p.subscriptionId), plan: planMap.get(p.planId) }));
  }

  async getAllPayments() {
    const payments = await this.paymentModel.find().sort({ createdAt: -1 }).lean();
    const subIds = payments.map((p) => p.subscriptionId).filter(Boolean);
    const subs = await this.subscriptionModel.find({ _id: { $in: subIds } }).lean();
    const planIds = payments.map((p) => p.planId).filter(Boolean);
    const plans = await this.planModel.find({ id: { $in: planIds } }).lean();
    const subMap = new Map(subs.map((s: any) => [s._id.toString(), s]));
    const planMap = new Map(plans.map((p: any) => [p.id, p]));
    return payments.map((p: any) => ({ ...p, subscription: subMap.get(p.subscriptionId), plan: planMap.get(p.planId) }));
  }

  async getAnalytics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const revenueTodayAgg = await this.paymentModel.aggregate([
      { $match: { status: 'SUCCESS', paidAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const revenueToday = revenueTodayAgg[0]?.total || 0;
    const successfulPayments = await this.paymentModel.countDocuments({ status: 'SUCCESS' });
    const failedPayments = await this.paymentModel.countDocuments({ status: 'FAILED' });
    const activeSubscriptions = await this.subscriptionModel.countDocuments({ status: 'ACTIVE' });

    return { revenueToday, successfulPayments, failedPayments, activeSubscriptions };
  }
}
