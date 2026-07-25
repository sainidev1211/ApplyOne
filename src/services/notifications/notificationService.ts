import { INotificationService, ServiceResponse } from '@/types/services';

class MockNotificationService implements INotificationService {
  async sendEmail(to: string, subject: string, body: string): Promise<ServiceResponse<void>> {
    try {
      console.log(`[NOTIFICATION - EMAIL]: Sending to ${to}. Subject: ${subject}`);
      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        data: null,
        error: null,
        message: `Email sent successfully to ${to}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to send email.',
        message: 'Email sending failed.',
      };
    }
  }

  async sendSMS(to: string, body: string): Promise<ServiceResponse<void>> {
    try {
      console.log(`[NOTIFICATION - SMS]: Sending to ${to}. Content: ${body}`);
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        success: true,
        data: null,
        error: null,
        message: `SMS sent successfully to ${to}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to send SMS.',
        message: 'SMS sending failed.',
      };
    }
  }

  async sendPush(userId: string, payload: Record<string, any>): Promise<ServiceResponse<void>> {
    try {
      console.log(`[NOTIFICATION - PUSH]: Sending to user ${userId}. Payload:`, payload);
      await new Promise((resolve) => setTimeout(resolve, 150));
      return {
        success: true,
        data: null,
        error: null,
        message: `Push notification sent to user ${userId}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to send push notification.',
        message: 'Push notification failed.',
      };
    }
  }
}

export const notificationService: INotificationService = new MockNotificationService();
