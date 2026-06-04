import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { PaginationQueryDto } from '../../common/dto/pagination/pagination-query.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Create product in current company' })
  create(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(currentUser, dto);
  }

  @Get()
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get products' })
  findAll(
    @CurrentUser() currentUser: AuthPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.productsService.findAll(currentUser, query);
  }

  @Get(':id')
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_STAFF,
  )
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.productsService.findOne(currentUser, id);
  }

  @Patch(':id')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Update product in current company' })
  update(
    @CurrentUser() currentUser: AuthPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(currentUser, id, dto);
  }

  @Delete(':id')
  @Auth(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Delete product in current company' })
  remove(@CurrentUser() currentUser: AuthPayload, @Param('id') id: string) {
    return this.productsService.remove(currentUser, id);
  }
}
