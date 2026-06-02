import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule,SecurityModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
