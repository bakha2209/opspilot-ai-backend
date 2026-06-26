import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  CompanyRepository,
  NotificationRepository,
} from '../../../libs/database/repository';
import { AiInternalService } from '../../ai-internal/ai-internal.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../../libs/database/entity';

@Injectable()
export class InventoryRiskMonitorScheduler {
  private readonly logger = new Logger(InventoryRiskMonitorScheduler.name);

  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly aiInternalService: AiInternalService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  // Every day at 08:30
  @Cron('30 8 * * *')
  async handleInventoryRiskMonitor() {
    this.logger.log('Inventory risk monitor started');

    const companies = await this.companyRepository.findItemMany({
      where: {},
    });

    for (const company of companies) {
      await this.checkCompanyRisk(company.id);
    }

    this.logger.log(
      `Inventory risk monitor completed. checkedCompanies=${companies.length}`,
    );
  }

  private async checkCompanyRisk(companyId: string) {
    const result = await this.aiInternalService.inventoryRisk({
      companyId,
    });

    const risks = result.risks ?? [];

    const criticalRisks = risks.filter((risk) => risk.riskLevel === 'CRITICAL');

    const highRisks = risks.filter((risk) => risk.riskLevel === 'HIGH');

    if (criticalRisks.length === 0 && highRisks.length === 0) {
      this.logger.log(`No serious inventory risks. companyId=${companyId}`);
      return;
    }

    const topRisks = [...criticalRisks, ...highRisks].slice(0, 5);

    const message = topRisks
      .map(
        (risk, index) =>
          `${index + 1}. ${risk.productName ?? 'Unknown product'} / ${
            risk.warehouseName ?? 'Unknown warehouse'
          } — ${risk.riskLevel} (qty: ${
            risk.currentQuantity
          }, safety: ${risk.safetyStock})`,
      )
      .join('\n');

    const since = new Date();
    since.setHours(since.getHours() - 12);

    const recentAlert = await this.notificationRepository.findRecentUnresolvedAiAlert(
      companyId,
      since,
    );

    if (recentAlert) {
      this.logger.log(
        `Recent AI inventory alert already exists. companyId=${companyId}`,
      );
      return;
    }

    await this.notificationsService.createSystemNotification({
      companyId,
      type: NotificationType.AI_ALERT,
      title: 'AI inventory risk alert',
      message: `OpsPilot AI detected ${criticalRisks.length} critical and ${highRisks.length} high inventory risks.\n${message}`,
      metadata: {
        criticalCount: criticalRisks.length,
        highCount: highRisks.length,
        risks: topRisks,
        source: 'AI_RISK_MONITOR',
      },
    });

    this.logger.log(
      `AI inventory risk notification created. companyId=${companyId}`,
    );
  }
}
