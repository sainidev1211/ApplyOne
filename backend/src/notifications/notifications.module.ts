import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service.js';
import { NotificationsProcessor } from './notifications.processor.js';
import { EmailService } from './email.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationsService, NotificationsProcessor, EmailService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
