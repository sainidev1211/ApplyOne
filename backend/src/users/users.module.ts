import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [UploadsModule],
  controllers: [UsersController],
  providers: [UsersService, ActivityLoggerService],
  exports: [UsersService],
})
export class UsersModule {}
