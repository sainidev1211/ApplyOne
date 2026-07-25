import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreatePaymentSessionDto, RefundPaymentDto } from './dto/payment.dto.js';
import { StripeProvider } from './providers/stripe.provider.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { IPaymentProvider } from './interfaces/payment-provider.interface.js';
import { PaymentMethod, PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { CouponsService } from '../coupons/coupons.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProvider,
    private readonly razorpayProvider: RazorpayProvider,
    private readonly couponsService: CouponsService
  ) {}

  private getProvider(method: PaymentMethod): IPaymentProvider {
    if (method === PaymentMethod.STRIPE) return this.stripeProvider;
    if (method === PaymentMethod.RAZORPAY) return this.razorpayProvider;
    throw new BadRequestException('Unsupported payment provider');
  }

  async createSession(userId: string, dto: CreatePaymentSessionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    let finalAmount = Number(plan.monthlyPrice);
    let discountAmount = 0;
    let couponId = null;

    if (dto.couponCode) {
      const validation = await this.couponsService.validateCoupon(userId, {
        code: dto.couponCode,
        planId: plan.id,
        amount: finalAmount
      });
      discountAmount = validation.discountAmount;
      finalAmount = validation.finalAmount;
      couponId = validation.couponId;
    }

    const provider = this.getProvider(dto.provider);
    
    // Create DB Subscription in PENDING/TRIAL state? No, better to just create Payment record linked to a pending Subscription
    const pendingSubscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        startDate: new Date(),
        expiresAt: new Date(), // temporary
        autoRenew: true,
        remainingJobCredits: 0,
        remainingAiCredits: 0,
        remainingResumeCredits: 0,
        remainingAtsCredits: 0,
        status: SubscriptionStatus.TRIAL // or PENDING logic
      }
    });

    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: pendingSubscription.id,
        amount: finalAmount,
        currency: plan.currency,
        paymentMethod: dto.provider,
        discountAmount,
        couponId,
        status: PaymentStatus.PENDING,
      }
    });

    const session = await provider.createSession({
      userId,
      planId: plan.id,
      amount: finalAmount,
      currency: plan.currency,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayOrderId: session.sessionId }
    });

    return {
      paymentId: payment.id,
      ...session
    };
  }

  async refund(adminId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { transactionId: dto.transactionId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.SUCCESS) throw new BadRequestException('Cannot refund a non-successful payment');

    const provider = this.getProvider(payment.paymentMethod as PaymentMethod);
    const providerRefundId = await provider.refundPayment({
      transactionId: dto.transactionId,
      amount: dto.amount,
      reason: dto.reason
    });

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED }
      }),
      this.prisma.refund.create({
        data: {
          paymentId: payment.id,
          amount: dto.amount,
          reason: dto.reason,
          providerRefundId
        }
      })
    ]);

    return { success: true, refundId: providerRefundId };
  }

  async getPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { subscription: { userId } },
      orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { plan: true } } }
    });
  }

  async getAllPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { user: true, plan: true } } }
    });
  }

  async getAnalytics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [revenueToday, successfulPayments, failedPayments, activeSubscriptions] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS, paidAt: { gte: today } },
        _sum: { amount: true }
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.SUCCESS } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } })
    ]);

    return {
      revenueToday: revenueToday._sum.amount || 0,
      successfulPayments,
      failedPayments,
      activeSubscriptions,
    };
  }
}
