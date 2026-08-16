import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller.js';
import { CreditsService } from './credits.service.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [SubscriptionsModule],
  controllers: [CreditsController],
  providers: [PrismaService, CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
