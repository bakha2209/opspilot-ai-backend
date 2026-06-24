import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateAiReorderActionDto {
  @ApiProperty()
  @IsUUID()
  companyId!: string;

  @ApiProperty()
  @IsUUID()
  warehouseId!: string;

  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  recommendedQuantity!: number;

  @ApiPropertyOptional({ example: 'Created by AI copilot after low-stock analysis' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}