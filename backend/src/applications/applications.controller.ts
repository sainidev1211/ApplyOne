import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service.js';
import {
  CreateApplicationDto,
  AssignEmployeeDto,
  UpdateStatusDto,
  AddNoteDto,
  ApplicationQueryDto,
} from './dto/application.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create an application request' })
  create(
    @Request() req: any,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(req.user.id, createApplicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'List applications' })
  findAll(@Request() req: any, @Query() query: ApplicationQueryDto) {
    return this.applicationsService.findAll(req.user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application details' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.applicationsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update application' })
  update(@Param('id') id: string) {
    // Only stubbed for basic updates, fully handled via dedicated endpoints
    return { message: 'Use dedicated endpoints to update status or notes' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel application' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.applicationsService.remove(id, req.user);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign employee to application (Admin)' })
  assignEmployee(
    @Request() req: any,
    @Param('id') id: string,
    @Body() assignDto: AssignEmployeeDto,
  ) {
    return this.applicationsService.assignEmployee(id, assignDto, req.user.id);
  }

  @Post(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Update application status (Admin/Employee)' })
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() statusDto: UpdateStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, statusDto, req.user.id);
  }

  @Post(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Add note to application (Admin/Employee)' })
  addNote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() noteDto: AddNoteDto,
  ) {
    return this.applicationsService.addNote(id, noteDto, req.user.id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get application timeline history' })
  getHistory(@Request() req: any, @Param('id') id: string) {
    return this.applicationsService.getHistory(id, req.user);
  }
}
