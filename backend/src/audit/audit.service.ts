import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    adminId: string,
    module: string,
    action: string,
    targetId?: string,
    targetType?: string,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string
  ) {
    this.logger.log(`[Audit] ${adminId} performed ${action} on ${module}`);
    
    return this.prisma.auditLog.create({
      data: {
        adminId,
        module,
        action,
        targetId,
        targetType,
        oldValue,
        newValue,
        ipAddress
      }
    });
  }
}
