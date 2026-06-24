import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConversationDto {
  @ApiPropertyOptional({ example: 'Warehouse Risk Analysis' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}
