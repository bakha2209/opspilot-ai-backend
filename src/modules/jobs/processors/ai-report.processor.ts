import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobName, QueueName } from '../constants/queue.constant';
import { AiInternalService } from '../../ai-internal/ai-internal.service';
import { CompanyIntegrationsService } from '../../company-integrations/company-integrations.service';
import { TelegramService } from '../../telegram/telegram.service';

@Processor(QueueName.AI_REPORT)
export class AiReportProcessor extends WorkerHost {
  private readonly logger = new Logger(AiReportProcessor.name);
  constructor(
    private readonly aiInternalService: AiInternalService,
    private readonly telegramService: TelegramService,
    private readonly companyIntegrationsService: CompanyIntegrationsService,
  ) {
    super();
  }

  async process(job: Job<{ companyId: string }>): Promise<void> {
    switch (job.name) {
      case JobName.WEEKLY_AI_REPORT:
        const report = await this.aiInternalService.weeklyOperationsReport({
          companyId: job.data.companyId,
        });

        const target = await this.companyIntegrationsService.getTelegramTarget(
          job.data.companyId,
        );

        if (!target.enabled || !target.chatId) {
          this.logger.log(
            `Weekly report generated but Telegram is disabled. companyId=${job.data.companyId}`,
          );

          this.logger.debug(JSON.stringify(report, null, 2));
          return;
        }

        const message = this.buildWeeklyReportMessage(report);

        await this.telegramService.sendMessage(message, target.chatId);

        this.logger.log(
          `Weekly AI report sent to Telegram. companyId=${job.data.companyId}`,
        );
        break;

      default:
        this.logger.warn(`Unknown AI report job: ${job.name}`);
    }
  }

  private buildWeeklyReportMessage(report: any): string {
    const inventory = report.inventory ?? {};
    const reorders = report.reorders ?? {};
    const topMovingProducts = report.topMovingProducts ?? [];
    const risks = report.risks ?? [];

    const topMovingText =
      topMovingProducts.length > 0
        ? topMovingProducts
            .slice(0, 5)
            .map(
              (item, index) =>
                `${index + 1}. ${item.productName} — moved ${item.totalMovedQuantity}`,
            )
            .join('\n')
        : 'No stock movement data.';

    const riskText =
      risks.length > 0
        ? risks
            .slice(0, 5)
            .map(
              (item, index) =>
                `${index + 1}. ${item.productName} / ${item.warehouseName} — ${item.riskLevel}`,
            )
            .join('\n')
        : 'No inventory risks detected.';

    return [
      '📊 <b>Weekly OpsPilot Operations Report</b>',
      '',
      '<b>Inventory</b>',
      `• Products: ${inventory.totalProducts ?? 0}`,
      `• Warehouses: ${inventory.totalWarehouses ?? 0}`,
      `• Low Stock Items: ${inventory.lowStockCount ?? 0}`,
      '',
      '<b>Reorders</b>',
      `• Pending Reorders: ${reorders.pending ?? 0}`,
      '',
      '<b>Top Moving Products</b>',
      topMovingText,
      '',
      '<b>Inventory Risks</b>',
      riskText,
    ].join('\n');
  }
}
