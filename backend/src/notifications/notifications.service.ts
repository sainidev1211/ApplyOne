import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';

export interface SendNotificationDto {
  userId: string;
  type: any; // NotificationType from Prisma
  title: string;
  message: string;
  template?: string; // If email template should be triggered
  context?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async notify(dto: SendNotificationDto) {
    // 1. Create In-App Notification record
    await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
      },
    });

    // 2. Queue Email / Push / WhatsApp if requested
    if (dto.template) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (user && user.email) {
        await this.notificationsQueue.add(
          'sendEmail',
          {
            to: user.email,
            template: dto.template,
            context: dto.context,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        );
      }
    }
  }
}
