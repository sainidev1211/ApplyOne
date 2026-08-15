import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreditsService } from './credits.service.js';
import { AddCreditsDto, DeductCreditsDto } from './dto/credit.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current credit balances for logged in user' })
  getCredits(@Request() req: any) {
    return this.creditsService.getCredits(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get credit transaction history' })
  getHistory(@Request() req: any) {
    return this.creditsService.getHistory(req.user.id);
  }

  @Post('add')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Add bonus credits to a user' })
  addCredits(@Body() dto: AddCreditsDto) {
    return this.creditsService.addCredits(dto);
  }

  @Post('deduct')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Manually deduct credits from a user' })
  deductCredits(@Body() dto: DeductCreditsDto) {
    return this.creditsService.deductCredits(dto);
  }
}
