import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule,SecurityModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
