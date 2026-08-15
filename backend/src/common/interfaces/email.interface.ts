export interface EmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateData?: Record<string, unknown>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailSendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface IEmailService {
  sendEmail(payload: EmailPayload): Promise<EmailSendResult>;
  sendWelcomeEmail(to: string, name: string): Promise<EmailSendResult>;
  sendPasswordResetEmail(
    to: string,
    resetLink: string,
  ): Promise<EmailSendResult>;
  sendVerificationEmail(
    to: string,
    verificationLink: string,
  ): Promise<EmailSendResult>;
  sendSubscriptionConfirmationEmail(
    to: string,
    planName: string,
  ): Promise<EmailSendResult>;
  sendApplicationStatusEmail(
    to: string,
    jobTitle: string,
    status: string,
  ): Promise<EmailSendResult>;
}
