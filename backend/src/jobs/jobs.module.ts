import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [PrismaService, JobsService],
})
export class JobsModule {}
