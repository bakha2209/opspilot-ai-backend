import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { StockMovementsService } from './stock-movements.service';

@ApiTags('Stock Movements')
@ApiBearerAuth()
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get()
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get stock movement history' })
  findAll(@CurrentUser() currentUser: AuthPayload) {
    return this.stockMovementsService.findAll(currentUser);
  }

  @Get('product/:productId')
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get stock movement history by product' })
  findByProduct(
    @CurrentUser() currentUser: AuthPayload,
    @Param('productId') productId: string,
  ) {
    return this.stockMovementsService.findByProduct(currentUser, productId);
  }
}
