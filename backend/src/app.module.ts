import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import appConfig from './config/app.config.js';
import jwtConfig from './config/jwt.config.js';
import groqConfig from './config/groq.config.js';

import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { AiModule } from './ai/ai.module.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import { UsersModule } from './users/users.module';
import { ResumeModule } from './resume/resume.module';
import { CompaniesModule } from './companies/companies.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { EmployeesModule } from './employees/employees.module';
import { AdminModule } from './admin/admin.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { CreditsModule } from './credits/credits.module';
import { FeatureAccessModule } from './feature-access/feature-access.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CouponsModule } from './coupons/coupons.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ChatModule } from './chat/chat.module.js';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module.js';
import { AtsModule } from './ats/ats.module.js';
import { JobImportModule } from './job-import/job-import.module.js';
import { JobAutomationModule } from './job-automation/job-automation.module.js';
import { SearchModule } from './search/search.module.js';
import { AiAnalyticsModule } from './ai-analytics/ai-analytics.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';

// Production Infrastructure Modules
import { RedisCacheModule } from './redis/redis-cache.module.js';
import { QueueModule } from './queue/queue.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AuditModule } from './audit/audit.module.js';

@Module({
  imports: [
    // Configuration — loads backend/.env
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, groqConfig],
      // One shared root .env; only VITE_* keys are exposed to the browser.
      envFilePath: '../.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
      },
    ]),

    // Core Infrastructure
    DatabaseModule,
    AiModule,
    UploadsModule,

    // Feature Modules
    AuthModule,
    HealthModule,
    UsersModule,
    ResumeModule,
    CompaniesModule,
    JobsModule,
    ApplicationsModule,
    EmployeesModule,
    AdminModule,
    PlansModule,
    SubscriptionsModule,
    CreditsModule,
    FeatureAccessModule,
    PaymentsModule,
    WebhooksModule,
    CouponsModule,
    InvoicesModule,
    ChatModule,
    KnowledgeBaseModule,
    AtsModule,
    JobImportModule,
    JobAutomationModule,
    SearchModule,
    AiAnalyticsModule,
    CampaignsModule,
    RedisCacheModule,
    QueueModule.register(),
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
