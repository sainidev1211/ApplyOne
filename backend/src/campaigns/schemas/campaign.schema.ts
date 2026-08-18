import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { randomUUID } from 'crypto';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true, unique: true, default: () => randomUUID() }) id: string;
  @Prop({ required: true, trim: true, index: true }) name: string;
  @Prop() description?: string;
  @Prop({ type: [String], default: [], index: true }) userIds: string[];
  @Prop({ default: 'DRAFT', index: true }) status: string;
  @Prop({ default: 0 }) targetApplications: number;
  @Prop() startDate?: Date;
  @Prop() endDate?: Date;
  @Prop() notes?: string;
  @Prop({ required: true, index: true }) createdBy: string;
}
export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.index({ createdAt: -1 });
