import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { AiInternalController } from './ai-internal.controller';
import { AiInternalService } from './ai-internal.service';
import { AiInternalGuard } from './guards/ai-internal.guard';
import { SecurityModule } from '../../libs/core/security';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    forwardRef(() => NotificationsModule),
    EventsModule,
    AuditLogsModule,
  ],
  controllers: [AiInternalController],
  providers: [AiInternalService, AiInternalGuard],
  exports: [AiInternalService],
})
export class AiInternalModule {}
