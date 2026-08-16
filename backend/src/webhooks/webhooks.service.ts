import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { CreditsService } from '../credits/credits.service.js';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from '../payments/schemas/payment.schema.js';
import { Subscription } from '../subscriptions/schemas/subscription.schema.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly creditsService: CreditsService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {}

  async handleStripeWebhook(body: any, signature: string) {
    // 1. Verify Stripe signature (Mocked)
    const eventId = body.id || `mock_evt_${Date.now()}`;
    const eventType = body.type || 'payment_intent.succeeded';

    return this.processWebhookEvent('STRIPE', eventId, eventType, body);
  }

  async handleRazorpayWebhook(body: any, signature: string) {
    // 1. Verify Razorpay signature (Mocked)
    const eventId = body.id || `mock_evt_${Date.now()}`;
    const eventType = body.event || 'payment.captured';

    return this.processWebhookEvent('RAZORPAY', eventId, eventType, body);
  }

  private async processWebhookEvent(
    provider: string,
    eventId: string,
    eventType: string,
    payload: any,
  ) {
    // 2. Idempotency: use payment status/gateway info to avoid duplicate processing

    try {
      // 4. Handle specific events (e.g. payment success)
      if (
        eventType === 'payment_intent.succeeded' ||
        eventType === 'payment.captured'
      ) {
        const transactionId =
          payload.data?.object?.id ||
          payload.payload?.payment?.entity?.id ||
          'mock_txn';
        const gatewayOrderId =
          payload.data?.object?.metadata?.gatewayOrderId ||
          payload.payload?.order?.entity?.id;

        // Find payment by gatewayOrderId (since that's what we saved when creating session)
        // If testing without real webhooks, we'll just log success.
        if (gatewayOrderId) {
          const payment = await this.paymentModel.findOne({ razorpayOrderId: gatewayOrderId }).lean();
          if (payment && payment.status !== 'SUCCESS') {
            await this.activateSubscriptionAndPayment(payment._id.toString(), transactionId);
          }
        }
      }

      // optional: log success in Postgres webhookLog if necessary

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to process webhook ${eventId}`, error.stack);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  private async activateSubscriptionAndPayment(paymentId: string, transactionId: string) {
    // Update Mongo payment and subscription
    const payment = await this.paymentModel.findById(paymentId).lean();
    if (!payment) return;

    if (payment.status === 'SUCCESS') return;

    const paidAt = new Date();
    await this.paymentModel.updateOne({ _id: paymentId }, { status: 'SUCCESS', razorpayPaymentId: transactionId, paidAt, verifiedAt: new Date() });

    const plan = await this.subscriptionModel.findById(payment.subscriptionId).lean();
    const planDetails = await this.prisma.subscriptionPlan.findUnique({ where: { id: payment.planId } }).catch(() => null);

    // Update subscription in Mongo
    const credits = planDetails
      ? { remainingAiCredits: planDetails.aiCredits, remainingJobCredits: planDetails.jobCredits, remainingResumeCredits: planDetails.resumeCredits, remainingAtsCredits: planDetails.atsCredits }
      : {};

    await this.subscriptionModel.updateOne({ _id: payment.subscriptionId }, { status: 'ACTIVE', ...credits });

    // Also create invoice and creditTransaction in Postgres for reporting
    try {
      await this.prisma.invoice.create({
        data: {
          paymentId: paymentId,
          userId: payment.userId,
          invoiceNumber: `INV-${Date.now()}`,
          amount: payment.amount,
          currency: payment.currency,
          tax: 0,
          discount: 0,
          status: 'PAID',
        },
      });

      await this.prisma.creditTransaction.create({
        data: {
          userId: payment.userId,
          feature: 'Subscription Activation',
          creditsBefore: 0,
          creditsUsed: 0,
          creditsAfter: planDetails?.aiCredits || 0,
          reason: `Activated plan ${planDetails?.name || payment.planId}`,
          referenceId: paymentId,
        },
      });
    } catch (e) {
      this.logger.warn('Failed to create Postgres invoice/creditTransaction', e?.message || e);
    }
  }
}
