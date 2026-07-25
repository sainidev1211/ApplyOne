/**
 * Standardized service response format to avoid exposing raw exceptions to UI components.
 */
export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string | null;
}

/**
 * Service Abstraction Interfaces
 */

export interface ILoggingService {
  log(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(error: Error | string, context?: Record<string, any>): void;
}

export interface IAnalyticsService {
  trackPage(pageName: string): void;
  trackEvent(eventName: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  reset(): void;
}

export interface IStorageService {
  uploadFile(bucket: string, path: string, file: File): Promise<ServiceResponse<{ url: string }>>;
  downloadFile(bucket: string, path: string): Promise<ServiceResponse<{ blob: Blob }>>;
  deleteFile(bucket: string, path: string): Promise<ServiceResponse<void>>;
}

export interface INotificationService {
  sendEmail(to: string, subject: string, body: string): Promise<ServiceResponse<void>>;
  sendSMS(to: string, body: string): Promise<ServiceResponse<void>>;
  sendPush(userId: string, payload: Record<string, any>): Promise<ServiceResponse<void>>;
}
