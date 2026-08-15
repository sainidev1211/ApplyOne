import { Module } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  providers: [KnowledgeBaseService, PrismaService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
