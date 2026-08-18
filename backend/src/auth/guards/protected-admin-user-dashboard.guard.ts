import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isProtectedAdminAccount } from '../constants/protected-admin.js';

/** Prevents the executive admin from using candidate-only dashboard APIs. */
@Injectable()
export class ProtectedAdminUserDashboardGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (isProtectedAdminAccount(user)) {
      throw new ForbiddenException('The executive admin account is not a candidate dashboard account.');
    }
    return true;
  }
}
