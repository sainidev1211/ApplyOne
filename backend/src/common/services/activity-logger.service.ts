import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ActivityLoggerService {
  constructor(private readonly prisma: PrismaService) {}

  async log(userId: string, action: string, module: string, description?: string, req?: any) {
    try {
      const ipAddress = req?.ip || req?.socket?.remoteAddress;
      const userAgent = req?.headers?.['user-agent'];

      await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          module,
          description,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log activity', error);
    }
  }
}
