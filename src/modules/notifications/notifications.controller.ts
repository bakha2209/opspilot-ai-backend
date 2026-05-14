import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get notifications' })
  findAll(@CurrentUser() currentUser: AuthPayload) {
    return this.notificationsService.findAll(currentUser);
  }

  @Get('unread')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get unread notifications' })
  findUnread(@CurrentUser() currentUser: AuthPayload) {
    return this.notificationsService.findUnread(currentUser);
  }

  @Patch(':id/read')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(currentUser, id);
  }
}
