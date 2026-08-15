import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service.js';
import { UpdateTaskStatusDto } from './dto/employee.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Employee Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
@Controller('employee/tasks')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assigned tasks' })
  getTasks(@Request() req: any) {
    return this.employeesService.getTasks(req.user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get tasks modified or due today' })
  getTasksToday(@Request() req: any) {
    return this.employeesService.getTasksToday(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task status' })
  updateTaskStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskStatusDto,
  ) {
    return this.employeesService.updateTaskStatus(req.user.id, id, updateDto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark application task as complete (Applied)' })
  markTaskComplete(@Request() req: any, @Param('id') id: string) {
    return this.employeesService.markTaskComplete(req.user.id, id);
  }
}
