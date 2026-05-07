import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateCompanyUserDto {
  @ApiProperty({ example: 'staff@topparts.com' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'Warehouse Staff' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    enum: [UserRole.OPERATIONS_MANAGER, UserRole.WAREHOUSE_STAFF],
    example: UserRole.WAREHOUSE_STAFF,
  })
  @IsEnum(UserRole)
  role: UserRole;
}