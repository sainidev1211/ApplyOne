import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
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
  controllers: [AdminDashboardController, AdminUsersController, AdminEmployeesController, AdminSettingsController, AdminAuditController],
  providers: [PrismaService, AdminDashboardService, AdminUsersService, AdminEmployeesService, AdminSettingsService, AdminAuditService]
})
export class AdminModule {}
