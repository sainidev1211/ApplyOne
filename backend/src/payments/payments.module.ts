import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

import { StripeProvider } from './providers/stripe.provider.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { CouponsService } from '../coupons/coupons.service.js';

@Module({
  controllers: [PaymentsController],
  providers: [PrismaService, PaymentsService, StripeProvider, RazorpayProvider, CouponsService]
})
export class PaymentsModule {}
