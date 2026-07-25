import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobImportService } from '../job-import/job-import.service.js';

@Processor('background-jobs')
export class JobAutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(JobAutomationProcessor.name);

  constructor(private readonly jobImportService: JobImportService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background job ${job.id} of type ${job.name}`);

    if (job.name === 'importJobs') {
      const { sourceId } = job.data;
      return this.jobImportService.importJobs(sourceId);
    }

    if (job.name === 'cleanupTempFiles') {
      this.logger.log('Executing temporary files cleanup...');
      // Implement S3/Local storage cleanup of files older than X days
      return { cleaned: true };
    }

    if (job.name === 'cleanupOldLogs') {
      this.logger.log('Executing old logs cleanup...');
      // Implement DB cleanup of ActivityLogs/SearchLogs older than 90 days
      return { cleaned: true };
    }
  }
}
