import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUsersService } from '../services/admin-users.service.js';
import { UpdateUserRoleDto } from '../dto/admin.dto.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Admin / Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (with search/pagination)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.adminUsersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get extensive user details' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role' })
  updateRole(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUsersService.updateRole(req.user.id, id, dto);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block user' })
  blockUser(@Request() req: any, @Param('id') id: string) {
    return this.adminUsersService.toggleUserStatus(req.user.id, id, false);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate user' })
  activateUser(@Request() req: any, @Param('id') id: string) {
    return this.adminUsersService.toggleUserStatus(req.user.id, id, true);
  }
}
