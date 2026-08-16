import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { StripeProvider } from './providers/stripe.provider.js';
import { RazorpayProvider } from './providers/razorpay.provider.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { RazorpayController } from './razorpay.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema.js';
import { Subscription, SubscriptionSchema } from '../subscriptions/schemas/subscription.schema.js';
import { Plan, PlanSchema } from '../plans/schemas/plan.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [PaymentsController, RazorpayController],
  providers: [PaymentsService, StripeProvider, RazorpayProvider, CouponsService],
})
export class PaymentsModule {}
