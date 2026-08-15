// =============================================================================
// EmailService — Resend integration for transactional emails
// Uses RESEND_API_KEY from backend/.env
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly appUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY', '');
    this.resend = new Resend(apiKey);
    this.fromEmail = this.config.get<string>('EMAIL_FROM', 'ApplyOne <noreply@applyone.co>');
    const appUrl = this.config.get<string>('FRONTEND_URL');
    if (!appUrl) {
      throw new Error(
        'FRONTEND_URL is not defined. Set the environment variable FRONTEND_URL for email links to work correctly.',
      );
    }
    this.appUrl = appUrl;
  }

  async sendVerificationEmail(email: string, token: string, fullName: string): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your ApplyOne account',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1a1a2e; font-size: 28px; font-weight: 800; margin-bottom: 8px;">ApplyOne</h1>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 32px;">AI-powered job application engine</p>
            
            <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin-bottom: 16px;">
              Welcome, ${fullName}! 👋
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              You're one step away from automating your job applications with AI. Click the button below to verify your email address.
            </p>
            
            <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin-bottom: 24px;">
              ✅ Verify My Email
            </a>
            
            <p style="color: #9ca3af; font-size: 13px; margin-bottom: 8px;">
              Or copy this link: <a href="${verifyUrl}" style="color: #6366f1;">${verifyUrl}</a>
            </p>
            <p style="color: #9ca3af; font-size: 13px;">
              This link expires in <strong>24 hours</strong>. If you didn't create an account, you can ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">ApplyOne — Your AI Job Application Engine</p>
          </div>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (err: any) {
      this.logger.error(`Failed to send verification email to ${email}: ${err.message}`);
      throw err;
    }
  }

  async sendPasswordResetEmail(email: string, token: string, fullName: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your ApplyOne password',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1a1a2e; font-size: 28px; font-weight: 800; margin-bottom: 8px;">ApplyOne</h1>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 32px;">AI-powered job application engine</p>
            
            <h2 style="color: #1a1a2e; font-size: 22px; font-weight: 700; margin-bottom: 16px;">
              Password Reset Request
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${fullName}, we received a request to reset your password. Click the button below to set a new one.
            </p>
            
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin-bottom: 24px;">
              🔐 Reset My Password
            </a>
            
            <p style="color: #9ca3af; font-size: 13px; margin-bottom: 8px;">
              Or copy this link: <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
            </p>
            <p style="color: #9ca3af; font-size: 13px;">
              This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">ApplyOne — Your AI Job Application Engine</p>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email to ${email}: ${err.message}`);
      throw err;
    }
  }
}
