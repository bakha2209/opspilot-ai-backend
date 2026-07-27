import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'TopParts Manufacturing' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: '123-45-67890' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessNumber?: string;

  @ApiPropertyOptional({ example: 'admin@topparts.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '+82-10-1234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: 'Bakhodir Admin' })
  @IsString()
  @MaxLength(100)
  adminName!: string;

  @ApiProperty({ example: 'admin@topparts.com' })
  @IsEmail()
  @MaxLength(150)
  adminEmail!: string;

  @ApiProperty({ example: 'UseAStrongTemporaryPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  adminPassword!: string;
}
