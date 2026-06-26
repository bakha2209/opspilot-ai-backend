import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { QueueName } from './constants/queue.constant';
import { NotificationProcessor } from './processors/notification.processor';
import { TelegramModule } from '../telegram/telegram.module';
import { CompanyIntegrationsModule } from '../company-integrations/company-integrations.module';
import { AiReportProcessor } from './processors/ai-report.processor';
import { JobsController } from './jobs.controller';
import { AiInternalModule } from '../ai-internal/ai-internal.module';
import { WeeklyReportScheduler } from './schedulers/weekly-report.scheduler';
import { DatabaseModule } from '../../libs/database/database.module';
import { InventoryRiskMonitorScheduler } from './schedulers/inventory-risk-monitor.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
        prefix: configService.get<string>('BULLMQ_PREFIX') || 'opspilot',
      }),
    }),

    BullModule.registerQueue({
      name: QueueName.NOTIFICATION,
    }),
    BullModule.registerQueue({
      name: QueueName.AI_REPORT,
    }),
    TelegramModule,
    CompanyIntegrationsModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => AiInternalModule),
  ],
  providers: [
    JobsService,
    NotificationProcessor,
    AiReportProcessor,
    WeeklyReportScheduler,
    InventoryRiskMonitorScheduler,
  ],
  exports: [JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
