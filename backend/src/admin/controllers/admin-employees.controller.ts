import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminEmployeesService } from '../services/admin-employees.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/admin.dto.js';
import { PaginationQueryDto } from '../../users/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Admin / Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/employees')
export class AdminEmployeesController {
  constructor(private readonly adminEmployeesService: AdminEmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.adminEmployeesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee performance and details' })
  findOne(@Param('id') id: string) {
    return this.adminEmployeesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Provision new employee' })
  create(@Request() req: any, @Body() dto: CreateEmployeeDto) {
    return this.adminEmployeesService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee details' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.adminEmployeesService.update(req.user.id, id, dto);
  }
}
