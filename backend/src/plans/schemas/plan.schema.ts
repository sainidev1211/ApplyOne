import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true }) id: string;
  @Prop({ required: true }) slug: string;
  @Prop({ required: true }) name: string;
  @Prop() description?: string;
  @Prop({ required: true }) monthlyPrice: number;
  @Prop() yearlyPrice?: number;
  @Prop({ default: 'INR' }) currency: string;
  @Prop({ default: 0 }) jobCredits: number;
  @Prop({ default: 0 }) aiCredits: number;
  @Prop({ default: 0 }) resumeCredits: number;
  @Prop({ default: 0 }) atsCredits: number;
  @Prop({ type: Object, default: {} }) features: Record<string, any>;
  @Prop({ default: 'ACTIVE' }) status: string;
  @Prop({ default: 0 }) displayOrder: number;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

