import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SecurityModule } from '../../libs/core/security';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule,SecurityModule,CacheModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
