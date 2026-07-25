import { PrismaService } from '../database/prisma.service.js';
import { Module } from '@nestjs/common';
import { FeatureAccessService } from './feature-access.service.js';

@Module({
  providers: [PrismaService, FeatureAccessService]
})
export class FeatureAccessModule {}
