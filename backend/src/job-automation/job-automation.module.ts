import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobAutomationService } from './job-automation.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { JobImportModule } from '../job-import/job-import.module.js';

import { BullModule } from '@nestjs/bullmq';

import { JobAutomationProcessor } from './job-automation.processor.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JobImportModule,
    BullModule.registerQueue({ name: 'background-jobs' })
  ],
  providers: [JobAutomationService, JobAutomationProcessor, PrismaService]
})
export class JobAutomationModule {}
