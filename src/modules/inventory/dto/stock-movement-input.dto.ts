import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class StockMovementInputDto {
  @ApiProperty({ example: 'warehouse-uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Initial stock registration' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ example: 'Received from supplier' })
  @IsOptional()
  @IsString()
  memo?: string;
}
