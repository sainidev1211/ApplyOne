import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true, default: () => randomUUID() }) id: string;

  @Prop() userId: string;
  @Prop() subscriptionId: string;
  @Prop() planId: string;

  @Prop({ required: true }) amount: number;
  @Prop({ default: 'INR' }) currency: string;

  @Prop() razorpayOrderId?: string;
  @Prop() razorpayPaymentId?: string;
  @Prop() status?: string; // PENDING, SUCCESS, FAILED, REFUNDED

  @Prop() paidAt?: Date;
  @Prop() verifiedAt?: Date;
  @Prop() failureReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
