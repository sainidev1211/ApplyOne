import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class JobAutomationService {
  private readonly logger = new Logger(JobAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('background-jobs') private readonly backgroundQueue: Queue
  ) {}

  // Run every night at midnight to import jobs
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyJobImports() {
    this.logger.log('Running scheduled daily job imports...');
    const sources = await this.prisma.jobImportSource.findMany({ where: { isActive: true } });

    for (const source of sources) {
      try {
        await this.backgroundQueue.add('importJobs', { sourceId: source.id });
      } catch (error) {
        this.logger.error(`Scheduled import failed for source ${source.id}`, error);
      }
    }
  }

  // Run every hour to archive expired jobs
  @Cron(CronExpression.EVERY_HOUR)
  async handleJobExpiry() {
    this.logger.log('Running scheduled job expiry detection...');
    const now = new Date();
    
    const result = await this.prisma.job.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now }
      },
      data: { status: 'EXPIRED' }
    });

    if (result.count > 0) {
      this.logger.log(`Archived ${result.count} expired jobs.`);
    }
  }

  // Nightly Cleanup Jobs (ATS, Temporary files, AI logs)
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanups() {
    this.logger.log('Dispatching cleanup jobs to queue...');
    await this.backgroundQueue.add('cleanupTempFiles', {});
    await this.backgroundQueue.add('cleanupOldLogs', {});
  }
}
