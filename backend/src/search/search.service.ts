import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchJobs(userId: string | undefined, query: string) {
    // 1. Log query for analytics (Autocomplete / Recent Searches)
    if (query && query.length > 2) {
      await this.prisma.searchQueryLog.create({
        data: { userId, query },
      });
    }

    // 2. Perform Full Text Search
    // In PostgreSQL, this would ideally use Prisma's search capabilities:
    // e.g. search: query or ILIKE for basic setup
    return this.prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { company: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { company: true },
      take: 20,
    });
  }

  async getAutocomplete(query: string) {
    // Simple autocomplete utilizing recent queries
    const results = await this.prisma.searchQueryLog.groupBy({
      by: ['query'],
      where: { query: { contains: query, mode: 'insensitive' } },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 5,
    });

    return results.map((r: any) => r.query);
  }

  async getRecentSearches(userId: string) {
    const results = await this.prisma.searchQueryLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      distinct: ['query'],
      take: 5,
      select: { query: true },
    });

    return results.map((r: any) => r.query);
  }
}
