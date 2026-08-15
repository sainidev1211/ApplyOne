import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { CreditsService } from '../credits/credits.service.js';

@Module({
  controllers: [WebhooksController],
  providers: [
    PrismaService,
    WebhooksService,
    SubscriptionsService,
    CreditsService,
  ],
})
export class WebhooksModule {}
