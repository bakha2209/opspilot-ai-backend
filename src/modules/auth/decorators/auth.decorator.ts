import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Roles } from './roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TenantGuard } from '../guards/tenant.guard';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, TenantGuard, RolesGuard),
  );
}