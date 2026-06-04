import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { QueueName } from './constants/queue.constant';
import { NotificationProcessor } from './processors/notification.processor';


@Module({
  imports: [
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
  ],
  providers: [JobsService, NotificationProcessor],
  exports: [JobsService],
})
export class JobsModule {}
