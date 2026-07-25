import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(query: PaginationQueryDto & { module?: string; action?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(query.module && { module: query.module }),
      ...(query.action && { action: query.action }),
      ...(query.search && {
        OR: [
          { module: { contains: query.search, mode: 'insensitive' } },
          { action: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { admin: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
