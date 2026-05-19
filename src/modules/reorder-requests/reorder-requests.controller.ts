import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { ReorderRequestsService } from './reorder-requests.service';

@ApiTags('Reorder Requests')
@ApiBearerAuth()
@Controller('reorder-requests')
export class ReorderRequestsController {
  constructor(
    private readonly reorderRequestsService: ReorderRequestsService,
  ) {}

  @Get()
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({
    summary: 'Get reorder requests',
  })
  findAll(@CurrentUser() currentUser: AuthPayload) {
    return this.reorderRequestsService.findAll(currentUser);
  }

  @Patch(':id/approve')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({
    summary: 'Approve reorder request',
  })
  approve(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.reorderRequestsService.approve(currentUser, id);
  }

  @Patch(':id/reject')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({
    summary: 'Reject reorder request',
  })
  reject(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.reorderRequestsService.reject(currentUser, id);
  }
}
