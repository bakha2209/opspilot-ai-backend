import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AuthPayload } from '../types/auth-payload.type';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthPayload | undefined;

    if (!user) {
      throw new ForbiddenException('Authenticated user is missing');
    }

    // Platform-level super admin can access all tenants.
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!user.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    /**
     * For MVP:
     * - TenantGuard only checks that company context exists.
     *
     * Later:
     * - We will compare route params/body/query companyId with user.companyId
     * - We will force repository queries to include companyId
     */
    return true;
  }
}