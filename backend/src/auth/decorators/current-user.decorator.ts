import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUserDto } from '../dto/auth-response.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserDto => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUserDto }>();
    return request.user;
  },
);
