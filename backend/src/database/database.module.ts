import { Module, Global, Logger, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error(
            'MONGODB_URI is not defined. Set the environment variable MONGODB_URI to a valid MongoDB connection string.',
          );
        }
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [PrismaService],
  exports: [MongooseModule, PrismaService],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  onModuleInit(): void {
    this.logger.debug('Database module initialized');
  }
}
