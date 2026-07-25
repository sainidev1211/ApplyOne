import { ILoggingService } from '@/types/services';

class ConsoleLoggingService implements ILoggingService {
  log(message: string, context?: Record<string, any>): void {
    console.log(`[LOG]: ${message}`, context || '');
  }

  info(message: string, context?: Record<string, any>): void {
    console.info(`[INFO]: ${message}`, context || '');
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(`[WARN]: ${message}`, context || '');
  }

  error(error: Error | string, context?: Record<string, any>): void {
    const errorMsg = error instanceof Error ? error.message : error;
    console.error(`[ERROR]: ${errorMsg}`, error, context || '');
    // Future expansion: Sentry.captureException(error);
  }
}

export const loggingService: ILoggingService = new ConsoleLoggingService();
