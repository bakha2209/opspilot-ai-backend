import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobName, QueueName } from '../constants/queue.constant';
import { NotificationCreatedJobPayload } from '../jobs.service';
import { TelegramService } from '../../telegram/telegram.service';
import { CompanyIntegrationsService } from '../../company-integrations/company-integrations.service';

@Processor(QueueName.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly companyIntegrationsService: CompanyIntegrationsService,
  ) {
    super();
  }

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

    const message = this.buildTelegramMessage(payload);

   const target = await this.companyIntegrationsService.getTelegramTarget(
     payload.companyId,
   );

   if (!target.enabled || !target.chatId) {
     this.logger.log(
       `Company Telegram disabled or missing chatId. companyId=${payload.companyId}`,
     );
     return;
   }

   await this.telegramService.sendMessage(message, target.chatId);
  }

  private buildTelegramMessage(payload: NotificationCreatedJobPayload): string {
    const metadata = payload.metadata ?? {};

    if (payload.type === 'LOW_STOCK') {
      return [
        '🚨 <b>Low Stock Alert</b>',
        '',
        `<b>Product:</b> ${metadata.productName ?? '-'}`,
        `<b>SKU:</b> ${metadata.sku ?? '-'}`,
        `<b>Warehouse:</b> ${metadata.warehouseName ?? '-'}`,
        `<b>Current Quantity:</b> ${metadata.currentQuantity ?? '-'}`,
        `<b>Safety Stock:</b> ${metadata.safetyStock ?? '-'}`,
        '',
        payload.message,
      ].join('\n');
    }

    if (payload.type === 'REORDER') {
      return [
        '📦 <b>Reorder Notification</b>',
        '',
        `<b>Product:</b> ${metadata.productName ?? '-'}`,
        `<b>Warehouse:</b> ${metadata.warehouseName ?? '-'}`,
        `<b>Recommended Quantity:</b> ${metadata.recommendedQuantity ?? '-'}`,
        '',
        payload.message,
      ].join('\n');
    }

    return [
      '🔔 <b>OpsPilot Notification</b>',
      '',
      `<b>Type:</b> ${payload.type}`,
      `<b>Title:</b> ${payload.title}`,
      '',
      payload.message,
    ].join('\n');
  }
}
