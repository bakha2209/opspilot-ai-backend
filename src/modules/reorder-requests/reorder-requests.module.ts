import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReorderRequestsController } from './reorder-requests.controller';
import { ReorderRequestsService } from './reorder-requests.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule, NotificationsModule, EventsModule,SecurityModule],
  controllers: [ReorderRequestsController],
  providers: [ReorderRequestsService],
  exports: [ReorderRequestsService],
})
export class ReorderRequestsModule {}
