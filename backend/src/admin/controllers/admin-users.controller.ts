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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUsersService } from '../services/admin-users.service.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

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
  @ApiOperation({ summary: 'Push customized dashboard data to user account (credits, applications, plan)' })
  updateUserDashboard(@Param('id') id: string, @Body() body: Record<string, any>) {
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

  @Post('broadcast-notification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Broadcast in-app notification to all active users' })
  broadcastNotification(
    @Body() body: { title: string; message: string; type?: string; link?: string },
  ) {
    return this.adminUsersService.broadcastNotification(body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Permanently delete user' })
  deleteUser(@Param('id') id: string) {
    return this.adminUsersService.deleteUser(id);
  }

  @Post('seed-admin-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed default admin account if not created' })
  seedAdmin() {
    return this.adminUsersService.seedDefaultAdmin();
  }
}
