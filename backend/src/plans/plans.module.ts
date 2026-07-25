import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';

@Module({
  controllers: [PlansController],
  providers: [PrismaService, PlansService]
})
export class PlansModule {}
