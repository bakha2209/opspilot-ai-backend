import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get dashboard KPI summary' })
  summary(@CurrentUser() currentUser: AuthPayload) {
    return this.dashboardService.summary(currentUser);
  }

  @Get('overview')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get dashboard overview data' })
  overview(@CurrentUser() currentUser: AuthPayload) {
    return this.dashboardService.overview(currentUser);
  }

  @Get('low-stock')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get low-stock inventory items' })
  lowStock(@CurrentUser() currentUser: AuthPayload) {
    return this.dashboardService.lowStock(currentUser);
  }

  @Get('pending-reorders')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Get pending reorder requests' })
  pendingReorders(@CurrentUser() currentUser: AuthPayload) {
    return this.dashboardService.pendingReorders(currentUser);
  }

  @Get('recent-stock-movements')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get recent stock movements' })
  recentStockMovements(@CurrentUser() currentUser: AuthPayload) {
    return this.dashboardService.recentStockMovements(currentUser);
  }
}
