import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminSettingsService } from '../services/admin-settings.service.js';
import { UpdateSettingsDto } from '../dto/admin.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Admin / Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings' })
  getAllSettings() {
    return this.adminSettingsService.getAllSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update system settings' })
  updateSettings(@Request() req: any, @Body() dto: UpdateSettingsDto) {
    return this.adminSettingsService.updateSettings(req.user.id, dto);
  }
}
