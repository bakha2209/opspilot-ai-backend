import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'TopParts Manufacturing' })
  @IsString()
  @MaxLength(150)
  companyName!: string;

  @ApiPropertyOptional({ example: '123-45-67890' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessNumber?: string;

  @ApiProperty({ example: 'admin@topparts.com' })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ example: 'Bakhodir Admin' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password!: string;
}