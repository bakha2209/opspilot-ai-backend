import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Main Warehouse' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'WH-MAIN' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ example: 'Cheongju, South Korea' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
