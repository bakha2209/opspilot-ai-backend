import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
  )
  @ApiOperation({ summary: 'Get audit logs' })
  findAll(
    @CurrentUser() currentUser: AuthPayload,
    @Query() query: AuditLogQueryDto,
  ) {
    return this.auditLogsService.findAll(currentUser, query);
  }

  @Get('resource/:resourceType/:resourceId')
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
  )
  @ApiOperation({ summary: 'Get audit logs by resource' })
  findByResource(
    @CurrentUser() currentUser: AuthPayload,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.auditLogsService.findByResource(
      currentUser,
      resourceType,
      resourceId,
    );
  }

  @Post(':id/verify')
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
  )
  verify(@Param('id') id: string) {
    return this.auditLogsService.verifyAuditLog(id);
  }
}
