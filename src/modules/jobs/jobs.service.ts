import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobName, QueueName } from './constants/queue.constant';

export type NotificationCreatedJobPayload = {
  notificationId: string;
  companyId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
};

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue(QueueName.NOTIFICATION)
    private readonly notificationQueue: Queue,
    @InjectQueue(QueueName.AI_REPORT)
    private readonly aiReportQueue: Queue,
  ) {}

  async addWeeklyAiReportJob(companyId: string) {
    await this.aiReportQueue.add(
      JobName.WEEKLY_AI_REPORT,
      { companyId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }

  async addNotificationCreatedJob(payload: NotificationCreatedJobPayload) {
    await this.notificationQueue.add(JobName.NOTIFICATION_CREATED, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
