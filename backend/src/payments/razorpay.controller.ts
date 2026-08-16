import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment } from './schemas/payment.schema.js';
import { Subscription } from '../subscriptions/schemas/subscription.schema.js';
import { Plan } from '../plans/schemas/plan.schema.js';

class VerifyDto {
  @ApiProperty()
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty()
  @IsString()
  razorpay_order_id: string;

  @ApiProperty()
  @IsString()
  razorpay_signature: string;
}

@ApiTags('Razorpay')
@Controller('razorpay')
export class RazorpayController {
  constructor(
    private readonly razorpayProvider: RazorpayProvider,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel(Plan.name) private planModel: Model<Plan>,
  ) {}

  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Razorpay signature and activate subscription' })
  async verify(@Request() req: any, @Body() dto: VerifyDto) {
    if (!dto.razorpay_payment_id || !dto.razorpay_order_id || !dto.razorpay_signature)
      throw new BadRequestException('Missing verification fields');

    const payment = await this.paymentModel.findOne({ razorpayOrderId: dto.razorpay_order_id }).lean();
    if (!payment) throw new BadRequestException('Payment record not found');

    if (payment.status === 'SUCCESS') return { success: true, alreadyProcessed: true };

    const verified = await this.razorpayProvider.verifyPayment({
      gatewayOrderId: dto.razorpay_order_id,
      transactionId: dto.razorpay_payment_id,
      signature: dto.razorpay_signature,
    });

    if (!verified) return { success: false };

    const paidAt = new Date();

    // Compute subscription dates based on plan (default 1 month)
    const plan = await this.planModel.findOne({ id: payment.planId }).lean();
    const startDate = paidAt;
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Idempotent updates
    await this.paymentModel.updateOne({ _id: payment._id }, {
      status: 'SUCCESS',
      razorpayPaymentId: dto.razorpay_payment_id,
      paidAt,
      verifiedAt: new Date(),
    });

    await this.subscriptionModel.updateOne({ _id: payment.subscriptionId }, {
      status: 'ACTIVE',
      startDate,
      expiresAt,
      remainingJobCredits: plan?.jobCredits ?? 0,
      remainingAiCredits: plan?.aiCredits ?? 0,
      remainingResumeCredits: plan?.resumeCredits ?? 0,
      remainingAtsCredits: plan?.atsCredits ?? 0,
    });

    return { success: true };
  }
}
