import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiAnalyticsService } from './ai-analytics.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('AI Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('ai-analytics')
export class AiAnalyticsController {
  constructor(private readonly analyticsService: AiAnalyticsService) {}

  @Get()
  @ApiOperation({
    summary: 'Admin: Get complete AI Analytics (Usage, Cost, ATS, Search)',
  })
  getAnalytics() {
    return this.analyticsService.getGlobalAnalytics();
  }
}
