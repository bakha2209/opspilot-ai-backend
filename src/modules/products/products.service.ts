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

@Injectable()
export class ProductsService {
  constructor(private readonly productRepository: ProductRepository) {}

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

    return apiSuccess('Product created successfully', product);
  }

  async findAll(currentUser: AuthPayload) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const products = await this.productRepository.findItemMany({
        order: { createdAt: 'DESC' },
      });

      return apiSuccess('Products retrieved successfully', products);
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);

    const products = await this.productRepository.findByCompanyId(companyId);

    return apiSuccess('Products retrieved successfully', products);
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

    Object.assign(product, dto);

    const saved = await this.productRepository.saveItem(product);

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

    await this.productRepository.softDeleteItem(product);

    return apiSuccess('Product deleted successfully', { id });
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
