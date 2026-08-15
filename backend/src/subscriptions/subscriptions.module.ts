import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  controllers: [SubscriptionsController],
  providers: [PrismaService, SubscriptionsService],
})
export class SubscriptionsModule {}
