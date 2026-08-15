import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class JobImportService {
  private readonly logger = new Logger(JobImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importJobs(sourceId: string) {
    const source = await this.prisma.jobImportSource.findUnique({
      where: { id: sourceId },
    });
    if (!source) throw new Error('Source not found');

    this.logger.log(
      `Starting job import from ${source.provider} for company ${source.companyId}`,
    );

    // Mock Import Logic based on provider
    let jobsAdded = 0;
    const jobsUpdated = 0;
    let status = 'SUCCESS';
    let errorMessage = null;

    try {
      if (source.provider === 'GREENHOUSE') {
        // Fetch from Greenhouse API using source.boardUrl
        // jobsAdded = ...
      } else if (source.provider === 'LEVER') {
        // Fetch from Lever API
      } else {
        throw new Error('Unsupported provider');
      }

      jobsAdded = Math.floor(Math.random() * 5); // mock success
    } catch (e: any) {
      status = 'FAILED';
      errorMessage = e.message;
      this.logger.error(
        `Import failed for ${source.provider}: ${errorMessage}`,
      );
    }

    await this.prisma.jobImportLog.create({
      data: {
        sourceId,
        status,
        jobsAdded,
        jobsUpdated,
        errorMessage,
      },
    });

    await this.prisma.jobImportSource.update({
      where: { id: sourceId },
      data: { lastRunAt: new Date() },
    });

    return { status, jobsAdded, jobsUpdated };
  }
}
