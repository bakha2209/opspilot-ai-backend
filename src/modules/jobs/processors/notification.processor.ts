import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobName, QueueName } from '../constants/queue.constant';
import { NotificationCreatedJobPayload } from '../jobs.service';

@Processor(QueueName.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<NotificationCreatedJobPayload>): Promise<void> {
    switch (job.name) {
      case JobName.NOTIFICATION_CREATED:
        await this.handleNotificationCreated(job.data);
        break;

      default:
        this.logger.warn(`Unknown job received: ${job.name}`);
        break;
    }
  }

  private async handleNotificationCreated(
    payload: NotificationCreatedJobPayload,
  ) {
    this.logger.log(
      `Processing notification job: ${payload.notificationId} | ${payload.title}`,
    );

    /**
     * Future:
     * - send email
     * - send Telegram message
     * - send SMS
     * - call AI analysis job
     */
  }
}
