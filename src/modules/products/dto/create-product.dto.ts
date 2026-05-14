import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Industrial Motor A' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'MOTOR-A-001' })
  @IsString()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({
    example: 'High performance industrial motor',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '8801234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({
    example: 'EA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  safetyStock?: number;
}
