import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Prisma v7: datasourceUrl is passed here instead of schema.prisma
    // DATABASE_URL will point to Supabase PostgreSQL when DB phase begins
    super();
  }

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      this.logger.warn(
        'DATABASE_URL is not set — database features are disabled. ' +
        'Set it to your Supabase PostgreSQL connection string when DB phase begins.',
      );
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.warn(
        `Database connection failed: ${error instanceof Error ? error.message : String(error)}. ` +
        'Server will start without database connectivity.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch {
      // Ignore disconnect errors during shutdown
    }
  }
}
