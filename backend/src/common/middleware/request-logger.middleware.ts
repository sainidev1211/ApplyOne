import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Request');

  use(request: Request, _response: Response, next: NextFunction): void {
    const { method, originalUrl, ip, body } = request;
    const userAgent = request.get('user-agent') ?? '';
    const correlationId = request.get('x-correlation-id') ?? crypto.randomUUID();

    request.headers['x-correlation-id'] = correlationId;

    this.logger.log(
      `→ ${method} ${originalUrl} | IP: ${ip} | UA: ${userAgent} | CID: ${correlationId}`,
    );

    if (
      process.env.NODE_ENV === 'development' &&
      body &&
      Object.keys(body).length > 0
    ) {
      const sanitizedBody = this.sanitizeBody(body as Record<string, unknown>);
      this.logger.debug(`Body: ${JSON.stringify(sanitizedBody)}`);
    }

    next();
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'confirmPassword', 'token', 'secret', 'apiKey'];
    const sanitized = { ...body };

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
