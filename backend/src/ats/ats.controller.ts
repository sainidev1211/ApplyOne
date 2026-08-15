import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AtsService, AtsCheckDto } from './ats.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('ATS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ats')
export class AtsController {
  constructor(private readonly atsService: AtsService) {}

  @Post('check')
  @ApiOperation({ summary: 'Run ATS check on a resume' })
  check(@Request() req: any, @Body() dto: AtsCheckDto) {
    return this.atsService.runAtsCheck(req.user.id, dto);
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze the saved uploaded resume' })
  analyze(@Request() req: any, @Body() dto: AtsCheckDto) {
    return this.atsService.runAtsCheck(req.user.id, dto);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare resume against Job Description' })
  compare(@Request() req: any, @Body() dto: AtsCheckDto) {
    // Requires jobDescription in DTO
    return this.atsService.runAtsCheck(req.user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get ATS analysis history' })
  getHistory(@Request() req: any) {
    return this.atsService.getHistory(req.user.id);
  }
}
