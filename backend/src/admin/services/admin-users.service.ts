import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { UpdateUserRoleDto } from '../dto/admin.dto.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(query.search && {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
        resumes: true,
        applications: { include: { job: true }, take: 10, orderBy: { createdAt: 'desc' } },
        subscriptions: { take: 1, orderBy: { createdAt: 'desc' } },
        employee: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRole(adminId: string, targetUserId: string, dto: UpdateUserRoleDto) {
    if (adminId === targetUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
    });

    await this.logAudit(adminId, 'UPDATE_ROLE', targetUserId, 'User', { oldRole: targetUser.role }, { newRole: updated.role });

    return updated;
  }

  async toggleUserStatus(adminId: string, targetUserId: string, isActive: boolean) {
    if (adminId === targetUserId) {
      throw new BadRequestException('You cannot block/deactivate yourself');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
    });

    await this.logAudit(adminId, isActive ? 'ACTIVATE_USER' : 'BLOCK_USER', targetUserId, 'User', null, { isActive });
    return updated;
  }

  private async logAudit(adminId: string, action: string, targetId: string, targetType: string, oldVal: any, newVal: any) {
    await this.prisma.auditLog.create({
      data: {
        adminId,
        module: 'USERS',
        action,
        targetId,
        targetType,
        oldValue: oldVal || Prisma.JsonNull,
        newValue: newVal || Prisma.JsonNull,
      },
    });
  }
}
