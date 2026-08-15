import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  controllers: [ApplicationsController],
  providers: [ActivityLoggerService, PrismaService, ApplicationsService],
})
export class ApplicationsModule {}
