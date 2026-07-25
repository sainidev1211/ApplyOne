import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service.js';
import { SubscribeDto, CancelSubscriptionDto } from './dto/subscription.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current subscription details' })
  getSubscription(@Request() req: any) {
    return this.subscriptionsService.getSubscription(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get subscription history' })
  getHistory(@Request() req: any) {
    return this.subscriptionsService.getHistory(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Subscribe to a plan (also used for upgrade/downgrade)' })
  subscribe(@Request() req: any, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(req.user.id, dto);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  cancel(@Request() req: any, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancel(req.user.id, dto);
  }

  @Post('renew')
  @ApiOperation({ summary: 'Renew current/last subscription' })
  renew(@Request() req: any) {
    return this.subscriptionsService.renew(req.user.id);
  }
}
