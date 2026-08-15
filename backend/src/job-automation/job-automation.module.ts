import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobAutomationService } from './job-automation.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { JobImportModule } from '../job-import/job-import.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JobImportModule,
  ],
  providers: [JobAutomationService, PrismaService],
  exports: [JobAutomationService],
})
export class JobAutomationModule {}
