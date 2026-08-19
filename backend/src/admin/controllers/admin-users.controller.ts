import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Patch,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUsersService } from '../services/admin-users.service.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UpdateUserDashboardDto } from '../dto/update-dashboard-metrics.dto.js';

@ApiTags('Admin / Users')
@ApiBearerAuth('JWT')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all registered MongoDB users with search & filters' })
  findAll(
    @Query() query: PaginationQueryDto & { accountType?: string; hasResume?: string },
  ) {
    return this.adminUsersService.findAll(query);
  }

  @Get(':id/resume/download')
  @ApiOperation({ summary: 'Download or view candidate resume stored in MongoDB' })
  async downloadResume(
    @Param('id') id: string,
    @Query('resumeId') resumeId: string,
    @Query('inline') inline: string,
    @Res() res: Response,
  ) {
    const { resume, buffer } = await this.adminUsersService.getResumeDownload(id, resumeId);
    const contentDisposition =
      inline === 'true' || inline === '1'
        ? `inline; filename="${encodeURIComponent(resume.fileName || 'resume.pdf')}"`
        : `attachment; filename="${encodeURIComponent(resume.fileName || 'resume.pdf')}"`;
    res.setHeader('Content-Type', resume.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(buffer);
  }

  // ── Application endpoints must come before :id so they don't get swallowed ──

  @Post('broadcast-notification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Broadcast in-app notification to all active users' })
  broadcastNotification(
    @Body() body: { title: string; message: string; type?: string; link?: string },
  ) {
    return this.adminUsersService.broadcastNotification(body);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get full user details including resumes, dashboard data, preferences' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user core and profile data directly in MongoDB' })
  updateUser(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.adminUsersService.updateUser(id, body);
  }

  @Put(':id/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update dashboard settings and admin-managed metrics without replacing application records' })
  updateUserDashboard(@Param('id') id: string, @Body() body: UpdateUserDashboardDto) {
    return this.adminUsersService.updateUserDashboard(id, body);
  }

  @Patch(':id/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Partially update dashboard settings and admin-managed metrics' })
  patchUserDashboard(@Param('id') id: string, @Body() body: UpdateUserDashboardDto) {
    return this.adminUsersService.updateUserDashboard(id, body);
  }

  @Post(':id/notify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Send direct in-app notification to specific user' })
  sendNotification(
    @Param('id') id: string,
    @Body() body: { title: string; message: string; type?: string; link?: string },
  ) {
    return this.adminUsersService.sendUserNotification(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Permanently delete user' })
  deleteUser(@Param('id') id: string) {
    return this.adminUsersService.deleteUser(id);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // APPLICATION MANAGEMENT ENDPOINTS
  // ──────────────────────────────────────────────────────────────────────────

  @Get(':id/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all applications for a user' })
  getUserApplications(
    @Param('id') id: string,
    @Query() query: { status?: string; search?: string; page?: string; limit?: string },
  ) {
    return this.adminUsersService.getApplications(id, {
      status: query.status,
      search: query.search,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  @Post(':id/applications/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk import applications for a user' })
  bulkCreateApplications(@Param('id') id: string, @Body() body: { applications: any[] }) {
    return this.adminUsersService.bulkCreateApplications(id, body.applications || []);
  }

  @Post(':id/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add a single application for a user' })
  createApplication(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.adminUsersService.createApplication(id, body as {
      jobTitle: string;
      company: string;
      status: string;
      appliedDate?: string;
      location?: string;
      jobType?: string;
      jobUrl?: string;
      jobReference?: string;
      salary?: string;
      source?: string;
      campaign?: string;
      notes?: string;
      recruiterContact?: string;
    });
  }

  @Patch(':id/applications/:appId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update an application for a user' })
  updateApplication(
    @Param('id') id: string,
    @Param('appId') appId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.adminUsersService.updateApplication(id, appId, body);
  }

  @Delete(':id/applications/:appId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete an application for a user' })
  deleteApplication(@Param('id') id: string, @Param('appId') appId: string) {
    return this.adminUsersService.deleteApplication(id, appId);
  }
}
