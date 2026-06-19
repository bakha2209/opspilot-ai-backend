import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AiToolRequestDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}
