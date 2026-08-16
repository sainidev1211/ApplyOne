import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Document } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true, unique: true, default: () => randomUUID() }) id: string;

  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) planId: string;

  @Prop() startDate?: Date;
  @Prop() expiresAt?: Date;
  @Prop({ default: true }) autoRenew: boolean;

  @Prop({ default: 0 }) remainingJobCredits: number;
  @Prop({ default: 0 }) remainingAiCredits: number;
  @Prop({ default: 0 }) remainingResumeCredits: number;
  @Prop({ default: 0 }) remainingAtsCredits: number;

  @Prop({ default: 'TRIAL' }) status: string;
  @Prop() cancelledAt?: Date;
  @Prop() cancellationReason?: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
