import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { User, UserSchema } from './schemas/user.schema.js';

@Module({
  imports: [
    UploadsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, ActivityLoggerService],
  exports: [UsersService],
})
export class UsersModule {}
