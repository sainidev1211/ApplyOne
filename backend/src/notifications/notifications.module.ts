import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { EmailService } from './email.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  providers: [
    NotificationsService,
    EmailService,
    PrismaService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
