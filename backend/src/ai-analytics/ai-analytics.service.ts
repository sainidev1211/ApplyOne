import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AiAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalAnalytics() {
    // 1. Overall AI Usage Stats
    const totalAiUses = await this.prisma.aiHistory.count();
    const totalTokensUsed = await this.prisma.tokenUsageLog.aggregate({
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true
      }
    });

    // 2. Breakdowns by Feature
    const featureBreakdownRaw = await this.prisma.aiHistory.groupBy({
      by: ['feature'],
      _count: { feature: true }
    });
    const featureBreakdown = featureBreakdownRaw.map((f: any) => ({
      feature: f.feature,
      uses: f._count.feature
    }));

    // 3. ATS Engine Stats
    const atsTotalAnalyzed = await this.prisma.resumeAnalysis.count();
    const atsAvgScore = await this.prisma.resumeAnalysis.aggregate({
      _avg: { atsScore: true }
    });

    return {
      overview: {
        totalAiInvocations: totalAiUses,
        totalTokens: totalTokensUsed._sum.totalTokens || 0,
        estimatedCostUsd: (totalTokensUsed._sum.totalTokens || 0) * 0.000002 // assuming roughly $2 per 1M tokens
      },
      featureBreakdown,
      atsEngine: {
        totalResumesScored: atsTotalAnalyzed,
        averageScore: atsAvgScore._avg.atsScore || 0
      }
    };
  }
}
