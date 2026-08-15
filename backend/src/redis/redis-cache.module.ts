import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const logger = new Logger('RedisCacheModule');

        // Redis cache is optional; it will gracefully degrade if Redis is unavailable
        if (!redisUrl) {
          logger.warn(
            'REDIS_URL not defined. Redis cache will be disabled. ' +
              'Set REDIS_URL environment variable for distributed cache in production.',
          );
          return { ttl: 60 * 1000 }; // Default in-memory cache
        }

        try {
          return {
            store: await redisStore({
              url: redisUrl,
              ttl: 60 * 1000, // default 60s
            }),
          };
        } catch (error) {
          logger.error(
            `Failed to connect to Redis at ${redisUrl}. Falling back to in-memory cache.`,
            error instanceof Error ? error.message : String(error),
          );
          return { ttl: 60 * 1000 }; // Graceful fallback
        }
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
