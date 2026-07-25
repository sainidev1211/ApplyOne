import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Admin / Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/audit-logs')
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with filtering' })
  getLogs(@Query() query: PaginationQueryDto & { module?: string; action?: string }) {
    return this.adminAuditService.getLogs(query);
  }
}
