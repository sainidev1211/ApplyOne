import { Module } from '@nestjs/common';
import { JobImportService } from './job-import.service.js';
import { JobImportController } from './job-import.controller.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  controllers: [JobImportController],
  providers: [JobImportService, PrismaService],
  exports: [JobImportService]
})
export class JobImportModule {}
