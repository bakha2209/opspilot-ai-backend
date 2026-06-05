import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyIntegrationDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  telegramEnabled?: boolean;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  telegramChatId?: string;
}
