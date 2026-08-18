import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class StoredResume {
  @Prop({ required: true }) id: string;
  @Prop({ required: true }) fileName: string;
  @Prop({ default: 'database' }) storagePath: string;
  @Prop({ required: true }) mimeType: string;
  @Prop({ required: true }) fileSize: number;
  @Prop({ type: Buffer }) fileData?: Buffer;
  @Prop({ default: 1 }) version: number;
  @Prop({ default: true }) isDefault: boolean;
  @Prop({ default: 'ACTIVE' }) status: string;
  @Prop() extractedText?: string;
  @Prop({ type: Object }) atsAnalysis?: Record<string, unknown>;
  @Prop({ default: Date.now }) createdAt: Date;
  @Prop({ default: Date.now }) updatedAt: Date;
}

export const StoredResumeSchema = SchemaFactory.createForClass(StoredResume);

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String })
  _id!: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  phone?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ default: 'USER' })
  role: string;

  @Prop({ default: 'STUDENT' })
  accountType: string;

  @Prop({ default: false })
  hasExperience: boolean;

  @Prop()
  companyName?: string;

  @Prop()
  roleDetails?: string;

  @Prop({ type: [String], default: [] })
  employmentTypes: string[];

  @Prop()
  lastMonthlyPackage?: string;

  @Prop()
  expectedPackageFullTime?: string;

  @Prop()
  expectedPackagePartTime?: string;

  @Prop()
  expectedPackageInternship?: string;

  @Prop({ type: Object })
  expectedPackages?: Record<string, string>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  passwordHash?: string;

  @Prop({ default: 'PASSWORD' })
  authProvider: 'PASSWORD' | 'GOOGLE';

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ default: false })
  profileCompleted: boolean;

  @Prop()
  resetPasswordTokenHash?: string;

  @Prop()
  resetPasswordExpiresAt?: Date;

  @Prop()
  resumeFileName?: string;

  @Prop()
  resumePath?: string;

  @Prop()
  bio?: string;

  @Prop()
  linkedinUrl?: string;

  @Prop()
  githubUrl?: string;

  @Prop()
  portfolioUrl?: string;

  @Prop({ type: Object, default: {} })
  preferences?: Record<string, unknown>;

  // A Mixed object keeps legacy MongoDB dashboard fields intact while formally
  // supporting currentPlan, remainingCredits, jobsInProgress, adminMessage and
  // flexible string-valued dashboardMetrics.
  @Prop({ type: Object, default: {} })
  dashboardData?: Record<string, any>;

  @Prop({ type: [Object], default: [] })
  notifications?: Record<string, any>[];

  @Prop()
  adminNotes?: string;

  // Resumes belong to the MongoDB user account. The top-level legacy fields
  // above are kept for backwards compatibility with existing accounts.
  @Prop({ type: [StoredResumeSchema], default: [] })
  resumes: StoredResume[];
}

export const UserSchema = SchemaFactory.createForClass(User);
