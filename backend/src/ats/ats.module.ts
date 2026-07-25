import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller.js';
import { AtsService } from './ats.service.js';
import { AiModule } from '../ai/ai.module.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  imports: [AiModule],
  controllers: [AtsController],
  providers: [AtsService, PrismaService]
})
export class AtsModule {}
