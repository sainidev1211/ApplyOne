import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, PrismaHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prismaService: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prismaService),
      () => this.http.pingCheck('ai-provider', 'https://api.google.com'), // Generic AI ping check
      // For Redis, terminus has a microservice check but we can assume DB is primary
    ]);
  }
}
