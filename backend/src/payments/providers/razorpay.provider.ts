import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import {
  IPaymentProvider,
  CreatePaymentSessionParams,
  PaymentSessionResponse,
  VerifyPaymentParams,
  RefundPaymentParams,
} from '../interfaces/payment-provider.interface.js';

@Injectable()
export class RazorpayProvider implements IPaymentProvider {
  private razorpay: any;
  private keyId: string | undefined;
  private keySecret: string | undefined;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!this.keyId || !this.keySecret) {
      // provider will still be constructed in non-production/dev, but operations will fail with clear errors
      this.razorpay = null;
    } else {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
  }

  private ensureClient() {
    if (!this.razorpay) throw new UnauthorizedException('Razorpay keys not configured');
    return this.razorpay;
  }

  // Create a Razorpay order. `params.amount` is expected in major currency units (e.g. 9.99 INR)
  async createSession(
    params: CreatePaymentSessionParams,
  ): Promise<PaymentSessionResponse> {
    const client = this.ensureClient();

    const amountNumber = Number(params.amount ?? 0);
    if (Number.isNaN(amountNumber) || amountNumber <= 0)
      throw new BadRequestException('Invalid amount');

    // Convert to smallest currency unit (paise)
    const amountPaise = Math.round(amountNumber * 100);
    if (amountPaise < 100) throw new BadRequestException('Minimum amount is 100 paise');

    const receipt = `rcpt_${Date.now()}`;

    const order = await client.orders.create({
      amount: amountPaise,
      currency: params.currency ?? 'INR',
      receipt,
      payment_capture: 1,
    });

    return {
      sessionId: order.id,
      url: '',
      meta: {
        order,
      },
    } as unknown as PaymentSessionResponse;
  }

  // Standalone order creation used by public endpoints (amount in rupees)
  async createOrderPublic(amount: number, currency = 'INR', receipt?: string) {
    const client = this.ensureClient();
    const amountNumber = Number(amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0)
      throw new BadRequestException('Invalid amount');
    const amountPaise = Math.round(amountNumber * 100);
    if (amountPaise < 100) throw new BadRequestException('Minimum amount is 100 paise');
    const order = await client.orders.create({
      amount: amountPaise,
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
      payment_capture: 1,
    });
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    // Map existing interface fields to Razorpay names
    const orderId = (params.gatewayOrderId as unknown as string) || '';
    const paymentId = params.transactionId || '';
    const signature = params.signature || '';

    if (!orderId || !paymentId || !signature)
      throw new BadRequestException('Missing fields for verification');
    const secret = this.keySecret;
    if (!secret) throw new UnauthorizedException('Razorpay secret not configured');

    const payload = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return expected === signature;
  }

  async refundPayment(params: RefundPaymentParams): Promise<string> {
    const client = this.ensureClient();
    // Expect provider to implement refunds via payments API
    const paymentId = params.transactionId;
    const amountNumber = params.amount ? Math.round(Number(params.amount) * 100) : undefined;
    const refundPayload: any = {};
    if (amountNumber) refundPayload.amount = amountNumber;
    const resp = await client.payments.refund(paymentId, refundPayload);
    return resp.id;
  }
}
