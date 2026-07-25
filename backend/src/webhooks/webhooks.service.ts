import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { CreditsService } from '../credits/credits.service.js';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly creditsService: CreditsService
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

  private async processWebhookEvent(provider: string, eventId: string, eventType: string, payload: any) {
    // 2. Idempotency Check
    const existing = await this.prisma.webhookLog.findUnique({ where: { eventId } });
    if (existing) {
      this.logger.log(`Webhook ${eventId} already processed`);
      return { success: true, message: 'Already processed' };
    }

    // 3. Log the Webhook
    await this.prisma.webhookLog.create({
      data: {
        provider,
        eventId,
        eventType,
        payload,
        status: 'PROCESSING'
      }
    });

    try {
      // 4. Handle specific events (e.g. payment success)
      if (eventType === 'payment_intent.succeeded' || eventType === 'payment.captured') {
        const transactionId = payload.data?.object?.id || payload.payload?.payment?.entity?.id || 'mock_txn';
        const gatewayOrderId = payload.data?.object?.metadata?.gatewayOrderId || payload.payload?.order?.entity?.id;

        // Find payment by gatewayOrderId (since that's what we saved when creating session)
        // If testing without real webhooks, we'll just log success.
        if (gatewayOrderId) {
            const payment = await this.prisma.payment.findFirst({
              where: { gatewayOrderId }
            });

            if (payment && payment.status !== PaymentStatus.SUCCESS) {
              await this.activateSubscriptionAndPayment(payment.id, transactionId);
            }
        }
      }

      await this.prisma.webhookLog.update({
        where: { eventId },
        data: { status: 'SUCCESS' }
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to process webhook ${eventId}`, error.stack);
      await this.prisma.webhookLog.update({
        where: { eventId },
        data: { status: 'FAILED' }
      });
      throw new BadRequestException('Webhook processing failed');
    }
  }

  private async activateSubscriptionAndPayment(paymentId: string, transactionId: string) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { subscription: { include: { plan: true } } }
      });

      if (!payment) return;

      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          transactionId,
          paidAt: new Date(),
        }
      });

      // Update subscription to final ACTIVE state, resetting limits to plan amounts
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          remainingAiCredits: payment.subscription.plan.aiCredits,
          remainingJobCredits: payment.subscription.plan.jobCredits,
          remainingResumeCredits: payment.subscription.plan.resumeCredits,
          remainingAtsCredits: payment.subscription.plan.atsCredits
        }
      });

      // Also create an invoice record
      await tx.invoice.create({
        data: {
          paymentId: payment.id,
          userId: payment.subscription.userId,
          invoiceNumber: `INV-${Date.now()}`,
          amount: payment.amount,
          currency: payment.currency,
          tax: payment.taxAmount || 0,
          discount: payment.discountAmount || 0,
          status: 'PAID'
        }
      });
      
      // Could also use CreditsService to log the addition of credits
      await tx.creditTransaction.create({
          data: {
            userId: payment.subscription.userId,
            feature: 'Subscription Activation',
            creditsBefore: 0,
            creditsUsed: 0,
            creditsAfter: payment.subscription.plan.aiCredits, // Simplify for log
            reason: `Activated plan ${payment.subscription.plan.name}`,
            referenceId: payment.id
          }
      });
    });
  }
}
