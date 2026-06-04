import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { ProductEntity } from '../../libs/database/entity';
import { ProductRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';
import { PaginationQueryDto } from '../../common/dto/pagination/pagination-query.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/constants/audit-aution.constant';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly cacheService: CacheService,
  ) {}

  async create(currentUser: AuthPayload, dto: CreateProductDto) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const existing = await this.productRepository.findBySkuAndCompanyId(
      dto.sku,
      companyId,
    );

    if (existing) {
      throw new ConflictException('SKU already exists in this company');
    }

    const product = await this.productRepository.createAndSaveItem({
      ...dto,
      companyId,
    } as Partial<ProductEntity>);

    await this.auditLogsService.create({
      companyId,
      userId: currentUser.sub,
      action: AuditAction.PRODUCT_CREATED,
      resourceType: 'Product',
      resourceId: product.id,
      beforeData: null,
      afterData: product,
    });

    await this.cacheService.delByPattern(`dashboard:*:${companyId}`);

    return apiSuccess('Product created successfully', product);
  }

  async findAll(currentUser: AuthPayload, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const { items, totalItems } =
        await this.productRepository.findPaginatedAll({
          page,
          limit,
        });

      return apiSuccess('Products retrieved successfully', {
        items,
        meta: buildPaginationMeta({ page, limit, totalItems }),
      });
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);

    const { items, totalItems } =
      await this.productRepository.findPaginatedByCompanyId({
        companyId,
        page,
        limit,
        search: query.search,
      });

    return apiSuccess('Products retrieved successfully', {
      items,
      meta: buildPaginationMeta({ page, limit, totalItems }),
    });
  }

  async findOne(currentUser: AuthPayload, id: string) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const product = await this.productRepository.findItemOne({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return apiSuccess('Product retrieved successfully', product);
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);

    const product = await this.productRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!product) {
      throw new NotFoundException('Product not found in your company');
    }

    return apiSuccess('Product retrieved successfully', product);
  }

  async update(currentUser: AuthPayload, id: string, dto: UpdateProductDto) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const product = await this.productRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!product) {
      throw new NotFoundException('Product not found in your company');
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productRepository.findBySkuAndCompanyId(
        dto.sku,
        companyId,
      );

      if (existing) {
        throw new ConflictException('SKU already exists in this company');
      }
    }
    const beforeData = { ...product };
    Object.assign(product, dto);

    const saved = await this.productRepository.saveItem(product);
    await this.auditLogsService.create({
      companyId,
      userId: currentUser.sub,
      action: AuditAction.PRODUCT_UPDATED,
      resourceType: 'Product',
      resourceId: saved.id,
      beforeData,
      afterData: saved,
    });
    await this.cacheService.delByPattern(`dashboard:*:${companyId}`);
    return apiSuccess('Product updated successfully', saved);
  }

  async remove(currentUser: AuthPayload, id: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const product = await this.productRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!product) {
      throw new NotFoundException('Product not found in your company');
    }
    await this.auditLogsService.create({
      companyId,
      userId: currentUser.sub,
      action: AuditAction.PRODUCT_DELETED,
      resourceType: 'Product',
      resourceId: product.id,
      beforeData: product,
      afterData: null,
    });
    await this.productRepository.softDeleteItem(product);
    await this.cacheService.delByPattern(`dashboard:*:${companyId}`);

    return apiSuccess('Product deleted successfully', { id });
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
