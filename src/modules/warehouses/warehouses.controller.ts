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
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehousesService } from './warehouses.service';

@ApiTags('Warehouses')
@ApiBearerAuth()
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Create warehouse in current company' })
  create(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.warehousesService.create(currentUser, dto);
  }

  @Get()
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get warehouses' })
  findAll(@CurrentUser() currentUser: AuthPayload) {
    return this.warehousesService.findAll(currentUser);
  }

  @Get(':id')
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get warehouse by ID' })
  findOne(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.warehousesService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Update warehouse in current company' })
  update(
    @CurrentUser() currentUser: AuthPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Auth(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete warehouse in current company' })
  remove(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.warehousesService.remove(currentUser, id);
  }
}
