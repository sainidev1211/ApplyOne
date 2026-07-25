import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service.js';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole, PlanStatus } from '@prisma/client';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get active plans for pricing page' })
  getPublicPlans() {
    return this.plansService.getPublicPlans();
  }

  @Get('compare')
  @ApiOperation({ summary: 'Get plan feature matrix comparison' })
  getPlanComparison() {
    return this.plansService.getPlanComparison();
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all plans' })
  getAllPlans() {
    return this.plansService.getAllPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  getPlanById(@Param('id') id: string) {
    return this.plansService.getPlanById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a new plan' })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.plansService.createPlan(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update plan details' })
  updatePlan(@Param('id') id: string, @Body() dto: Partial<UpdatePlanDto>) {
    return this.plansService.updatePlan(id, dto);
  }

  @Post(':id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Activate a plan' })
  activatePlan(@Param('id') id: string) {
    return this.plansService.togglePlanStatus(id, PlanStatus.ACTIVE);
  }

  @Post(':id/deactivate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Deactivate a plan' })
  deactivatePlan(@Param('id') id: string) {
    return this.plansService.togglePlanStatus(id, PlanStatus.INACTIVE);
  }
}
