import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: [UserRole.OPERATIONS_MANAGER, UserRole.WAREHOUSE_STAFF],
    example: UserRole.OPERATIONS_MANAGER,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
