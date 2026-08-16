import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema.js';
import { Subscription, SubscriptionSchema } from '../subscriptions/schemas/subscription.schema.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { CreditsModule } from '../credits/credits.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    SubscriptionsModule,
    CreditsModule,
  ],
  controllers: [WebhooksController],
  providers: [PrismaService, WebhooksService],
})
export class WebhooksModule {}
