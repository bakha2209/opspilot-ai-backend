import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SecurityModule } from '../../libs/core/security';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DatabaseModule, SecurityModule, RealtimeModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
