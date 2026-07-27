import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { StockMovementInputDto } from './dto/stock-movement-input.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get current company inventory' })
  findAll(@CurrentUser() currentUser: AuthPayload) {
    return this.inventoryService.findAll(currentUser);
  }

  @Get(':id')
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get inventory record by ID' })
  findOne(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.inventoryService.findOne(currentUser, id);
  }

  @Post('stock-in')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Increase stock quantity' })
  stockIn(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: StockMovementInputDto,
  ) {
    return this.inventoryService.stockIn(currentUser, dto);
  }

  @Post('stock-out')
  @Auth(
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Decrease stock quantity' })
  stockOut(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: StockMovementInputDto,
  ) {
    return this.inventoryService.stockOut(currentUser, dto);
  }

  @Post('adjust')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Manually adjust stock quantity' })
  adjust(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.inventoryService.adjust(currentUser, dto);
  }
}
