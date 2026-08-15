import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '@prisma/client';

export interface LogHistoryParams {
  userId: string;
  feature: string;
  provider: string;
  prompt: any;
  response: any;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  executionTimeMs: number;
}

@Injectable()
export class AiHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async logHistory(params: LogHistoryParams) {
    return this.prisma.aiHistory.create({
      data: {
        userId: params.userId,
        feature: params.feature,
        provider: params.provider,
        prompt: params.prompt as Prisma.InputJsonValue,
        response: params.response as Prisma.InputJsonValue,
        status: params.status,
        executionTimeMs: params.executionTimeMs,
      },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.aiHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdminHistory() {
    return this.prisma.aiHistory.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
      take: 100, // limit to recent for admin view
    });
  }
}
