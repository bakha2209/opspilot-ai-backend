import { Body, Controller, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { TriggerWeeklyReportDto } from './dto/trigger-wwekly-report.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('weekly-ai-report')
  triggerWeeklyReport(@Body() dto: TriggerWeeklyReportDto) {
    return this.jobsService.addWeeklyAiReportJob(dto.companyId);
  }
}
