import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../../libs/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule, SecurityModule, AuthModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
