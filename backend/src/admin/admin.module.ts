import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema.js';
import { Subscription, SubscriptionSchema } from '../subscriptions/schemas/subscription.schema.js';
import { Plan, PlanSchema } from '../plans/schemas/plan.schema.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminDashboardController } from './controllers/admin-dashboard.controller.js';
import { AdminDashboardService } from './services/admin-dashboard.service.js';
import { AdminUsersController } from './controllers/admin-users.controller.js';
import { AdminUsersService } from './services/admin-users.service.js';
import { AdminEmployeesController } from './controllers/admin-employees.controller.js';
import { AdminEmployeesService } from './services/admin-employees.service.js';
import { AdminSettingsController } from './controllers/admin-settings.controller.js';
import { AdminSettingsService } from './services/admin-settings.service.js';
import { AdminAuditController } from './controllers/admin-audit.controller.js';
import { AdminAuditService } from './services/admin-audit.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminEmployeesController,
    AdminSettingsController,
    AdminAuditController,
  ],
  providers: [
    PrismaService,
    AdminDashboardService,
    AdminUsersService,
    AdminEmployeesService,
    AdminSettingsService,
    AdminAuditService,
  ],
  exports: [AdminUsersService, AdminDashboardService],
})
export class AdminModule {}
