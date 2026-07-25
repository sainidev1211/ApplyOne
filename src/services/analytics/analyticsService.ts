import { IAnalyticsService } from '@/types/services';
import { FEATURE_FLAGS } from '@/config/appConfig';

class ConsoleAnalyticsService implements IAnalyticsService {
  trackPage(pageName: string): void {
    if (!FEATURE_FLAGS.ENABLE_ANALYTICS) return;
    console.log(`[ANALYTICS - PAGE VIEW]: ${pageName}`);
    // Future integration: mixpanel.track('Page View', { page: pageName });
  }

  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!FEATURE_FLAGS.ENABLE_ANALYTICS) return;
    console.log(`[ANALYTICS - EVENT]: ${eventName}`, properties || '');
    // Future integration: mixpanel.track(eventName, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!FEATURE_FLAGS.ENABLE_ANALYTICS) return;
    console.log(`[ANALYTICS - IDENTIFY]: ${userId}`, traits || '');
    // Future integration: mixpanel.identify(userId); mixpanel.people.set(traits);
  }

  reset(): void {
    if (!FEATURE_FLAGS.ENABLE_ANALYTICS) return;
    console.log(`[ANALYTICS - RESET]`);
    // Future integration: mixpanel.reset();
  }
}

export const analyticsService: IAnalyticsService = new ConsoleAnalyticsService();
