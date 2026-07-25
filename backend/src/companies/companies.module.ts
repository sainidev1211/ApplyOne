import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  controllers: [CompaniesController],
  providers: [PrismaService, CompaniesService]
})
export class CompaniesModule {}
