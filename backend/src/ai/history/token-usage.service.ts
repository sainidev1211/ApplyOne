import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

export interface LogTokenUsageParams {
  userId: string;
  feature: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  creditsUsed: number;
}

@Injectable()
export class TokenUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async logUsage(params: LogTokenUsageParams) {
    // Basic cost estimation (can be extracted to configuration later)
    // Example: $0.0001 per 1K prompt tokens, $0.0002 per 1K completion tokens
    const promptCost = (params.promptTokens / 1000) * 0.0001;
    const completionCost = (params.completionTokens / 1000) * 0.0002;
    const costEstimate = promptCost + completionCost;

    return this.prisma.tokenUsageLog.create({
      data: {
        userId: params.userId,
        feature: params.feature,
        provider: params.provider,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        totalTokens: params.totalTokens,
        creditsUsed: params.creditsUsed,
        costEstimate: costEstimate,
      },
    });
  }

  async getUsageStats() {
    // Admin analytics
    const [totalUsage, featureBreakdown] = await Promise.all([
      this.prisma.tokenUsageLog.aggregate({
        _sum: {
          totalTokens: true,
          creditsUsed: true,
          costEstimate: true,
        },
      }),
      this.prisma.tokenUsageLog.groupBy({
        by: ['feature'],
        _sum: {
          totalTokens: true,
          creditsUsed: true,
        },
        orderBy: {
          _sum: { totalTokens: 'desc' },
        },
      }),
    ]);

    return {
      totalTokens: totalUsage._sum.totalTokens || 0,
      totalCreditsUsed: totalUsage._sum.creditsUsed || 0,
      totalCostEstimate: totalUsage._sum.costEstimate || 0,
      featureBreakdown,
    };
  }
}
