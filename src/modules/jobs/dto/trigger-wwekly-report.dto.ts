// src/modules/jobs/dto/trigger-weekly-report.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TriggerWeeklyReportDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;
}
