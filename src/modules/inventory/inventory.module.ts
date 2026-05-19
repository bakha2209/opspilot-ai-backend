import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { SecurityModule } from '../../libs/core/security';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [DatabaseModule, SecurityModule, NotificationsModule, EventsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
