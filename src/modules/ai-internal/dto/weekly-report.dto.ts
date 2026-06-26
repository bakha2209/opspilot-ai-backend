import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class WeeklyReportDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;
}
