import { Module, Global, DynamicModule, Logger, Provider } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

function createMockQueue(name: string) {
  const logger = new Logger(`Queue[${name}]`);
  return {
    name,
    add: async (jobName: string, data: any, _opts?: any) => {
      logger.debug(`[MockQueue:${name}] Job "${jobName}" queued (Redis disabled)`);
      return { id: `mock-${Date.now()}`, name: jobName, data };
    },
    pause: async () => {},
    resume: async () => {},
    clean: async () => [],
    getJob: async () => null,
    getJobs: async () => [],
    close: async () => {},
  };
}

const mockNotificationsProvider: Provider = {
  provide: getQueueToken('notifications'),
  useFactory: () => createMockQueue('notifications'),
};

const mockBackgroundJobsProvider: Provider = {
  provide: getQueueToken('background-jobs'),
  useFactory: () => createMockQueue('background-jobs'),
};

@Global()
@Module({})
export class QueueModule {
  static register(): DynamicModule {
    const redisUrl = process.env.REDIS_URL?.trim();
    const logger = new Logger('QueueModule');

    if (!redisUrl) {
      logger.log('REDIS_URL not configured. Background queues will run with in-memory no-op handlers.');
      return {
        module: QueueModule,
        providers: [mockNotificationsProvider, mockBackgroundJobsProvider],
        exports: [mockNotificationsProvider, mockBackgroundJobsProvider],
      };
    }

    logger.log(`REDIS_URL detected. Enabling BullMQ queues.`);
    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            connection: {
              url: configService.get<string>('REDIS_URL'),
              maxRetriesPerRequest: null,
            },
          }),
          inject: [ConfigService],
        }),
        BullModule.registerQueue(
          { name: 'notifications' },
          { name: 'background-jobs' },
        ),
      ],
      exports: [BullModule],
    };
  }
}
