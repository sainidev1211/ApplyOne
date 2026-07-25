import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';
import { ActivityLoggerService } from '../common/services/activity-logger.service.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [UploadsModule],
  controllers: [ResumeController],
  providers: [ResumeService, ActivityLoggerService],
  exports: [ResumeService],
})
export class ResumeModule {}
