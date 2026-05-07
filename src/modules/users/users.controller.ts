import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('company')
  @Auth(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create user inside current company' })
  createCompanyUser(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: CreateCompanyUserDto,
  ) {
    return this.usersService.createCompanyUser(currentUser, dto);
  }

  @Get('company')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get users inside current company' })
  findCompanyUsers(@CurrentUser() currentUser: AuthPayload) {
    return this.usersService.findCompanyUsers(currentUser);
  }

  @Patch('company/:userId/role')
  @Auth(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update user role inside current company' })
  updateCompanyUserRole(
    @CurrentUser() currentUser: AuthPayload,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateCompanyUserRole(currentUser, userId, dto);
  }

  @Delete('company/:userId')
  @Auth(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete user inside current company' })
  removeCompanyUser(
    @CurrentUser() currentUser: AuthPayload,
    @Param('userId') userId: string,
  ) {
    return this.usersService.removeCompanyUser(currentUser, userId);
  }
}
