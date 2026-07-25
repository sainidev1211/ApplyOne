import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobImportService } from './job-import.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Job Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('job-imports')
export class JobImportController {
  constructor(private readonly jobImportService: JobImportService) {}

  @Post(':sourceId/trigger')
  @ApiOperation({ summary: 'Admin: Trigger manual job import' })
  triggerImport(@Param('sourceId') sourceId: string) {
    return this.jobImportService.importJobs(sourceId);
  }
}
