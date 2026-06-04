import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { SecurityModule } from '../../libs/core/security';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';
import { ReorderRequestsModule } from '../reorder-requests/reorder-requests.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    NotificationsModule,
    EventsModule,
    ReorderRequestsModule,
    AuditLogsModule,
    CacheModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
