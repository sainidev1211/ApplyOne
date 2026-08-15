import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller.js';
import { CreditsService } from './credits.service.js';

@Module({
  controllers: [CreditsController],
  providers: [PrismaService, CreditsService],
})
export class CreditsModule {}
