import { Module } from '@nestjs/common';
import { AiAnalyticsService } from './ai-analytics.service.js';
import { AiAnalyticsController } from './ai-analytics.controller.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  controllers: [AiAnalyticsController],
  providers: [AiAnalyticsService, PrismaService]
})
export class AiAnalyticsModule {}
