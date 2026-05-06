import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SecurityModule } from '../../libs/core/security';
import { DatabaseModule } from '../../libs/database/database.module';

@Module({
  imports: [DatabaseModule, SecurityModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
