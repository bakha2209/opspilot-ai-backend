import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompanyRepository } from '../../../libs/database/repository';
import { JobsService } from '../jobs.service';

@Injectable()
export class WeeklyReportScheduler {
  private readonly logger = new Logger(WeeklyReportScheduler.name);

  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly jobsService: JobsService,
  ) {}

  // Every Monday at 09:00
  @Cron('0 9 * * 1')
  async handleWeeklyReport() {
    this.logger.log('Weekly AI report scheduler started');

    const companies = await this.companyRepository.findItemMany({
      where: {},
    });

    for (const company of companies) {
      await this.jobsService.addWeeklyAiReportJob(company.id);
    }

    this.logger.log(`Weekly AI report jobs queued. count=${companies.length}`);
  }
}
