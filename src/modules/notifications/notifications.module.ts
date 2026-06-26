import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SecurityModule } from '../../libs/core/security';
import { RealtimeModule } from '../realtime/realtime.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    RealtimeModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
