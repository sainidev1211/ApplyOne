import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { FeatureAccessService } from './feature-access.service.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [SubscriptionsModule],
  providers: [PrismaService, FeatureAccessService],
  exports: [FeatureAccessService],
})
export class FeatureAccessModule {}
