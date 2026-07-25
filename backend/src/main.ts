import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // ── Security ────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ── CORS ────────────────────────────────────────────────────

  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? ['https://applyone.co', 'https://www.applyone.co']
        : ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials: true,
  });

  // ── Global prefix (exclude health routes for simplicity) ────
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // ── Global Validation Pipe ──────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Filters & Interceptors ───────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // ── Swagger (non-production only) ───────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ApplyOne API')
      .setDescription(
        '**ApplyOne** — AI-Powered Job Application Platform\n\n' +
          '### Development Auth Credentials\n' +
          '| Role | Email | Password |\n' +
          '|---|---|---|\n' +
          '| Admin | `admin@applyone.co` | `Admin@123` |\n' +
          '| Employee | `employee@applyone.co` | `Employee@123` |\n' +
          '| User | `user@applyone.co` | `User@123` |\n\n' +
          '> **Note:** Dev auth is temporary. POST `/api/v1/auth/login` → copy `accessToken` → click Authorize.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT access token here',
        },
        'JWT',
      )
      .addTag('Auth', 'DEV_ONLY — Temporary development authentication')
      .addTag('Health', 'Server health and status checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
      },
    });

    logger.log(`📖 Swagger: http://localhost:${port}/api/docs`);
  }

  // ── Graceful shutdown ────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`🚀 ApplyOne Backend → http://localhost:${port}`);
  logger.log(`📦 API Base       → http://localhost:${port}/api/v1`);
  logger.log(`🏥 Health         → http://localhost:${port}/health`);
  logger.log(`🌍 Environment    → ${nodeEnv}`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Failed to start server',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
