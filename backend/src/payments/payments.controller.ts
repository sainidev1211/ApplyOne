import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import {
  CreatePaymentSessionDto,
  RefundPaymentDto,
} from './dto/payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-session')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a checkout session (Stripe/Razorpay)' })
  createSession(@Request() req: any, @Body() dto: CreatePaymentSessionDto) {
    return this.paymentsService.createSession(req.user.id, dto);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment history for logged-in user' })
  getHistory(@Request() req: any) {
    return this.paymentsService.getPayments(req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all payments' })
  getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @Get('analytics')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get payment analytics' })
  getAnalytics() {
    return this.paymentsService.getAnalytics();
  }

  @Post('refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Refund a payment' })
  refundPayment(@Request() req: any, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refund(req.user.id, dto);
  }
}
