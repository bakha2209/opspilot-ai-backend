import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SecurityModule } from '../../libs/core/security';
import { DatabaseModule } from '../../libs/database/database.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [DatabaseModule, SecurityModule],
  providers: [AuthService,JwtAuthGuard,RolesGuard, TenantGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard,RolesGuard, TenantGuard],
})
export class AuthModule {}
