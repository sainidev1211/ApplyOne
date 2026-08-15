import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendTemplateEmail(
    to: string,
    template: string,
    context: Record<string, any>,
  ) {
    this.logger.log(`[EmailService] Sending ${template} email to ${to}`);
    // Mock AWS SES / SendGrid integration

    // Example templates: Welcome, Subscription, Payment, Application
    // Example logic:
    // await this.sesClient.sendEmail(...)
    return true;
  }
}
