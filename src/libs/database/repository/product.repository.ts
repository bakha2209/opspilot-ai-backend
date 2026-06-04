import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { ProductEntity } from '../entity';
import { ILike } from 'typeorm';

@Injectable()
export class ProductRepository extends OrmRepository<ProductEntity> {
  constructor(readonly dataSource: DataSource) {
    super(ProductEntity, dataSource, 'ProductRepository');
  }

  async findByCompanyId(companyId: string): Promise<ProductEntity[]> {
    return this.findItemMany({
      where: { companyId },
      relations: {
        mainImage: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<ProductEntity | null> {
    return this.findItemOne({
      where: { id, companyId },
      relations: { mainImage: true },
    });
  }

  async findBySkuAndCompanyId(
    sku: string,
    companyId: string,
  ): Promise<ProductEntity | null> {
    return this.findItemOne({
      where: { sku, companyId },
      relations: { mainImage: true },
    });
  }

  async countByCompanyId(companyId: string): Promise<number> {
    return this.count({
      where: { companyId },
    });
  }

  async findPaginatedByCompanyId(params: {
    companyId: string;
    page: number;
    limit: number;
    search?: string;
  }) {
    const { companyId, page, limit, search } = params;

    const where = search
      ? [
          { companyId, name: ILike(`%${search}%`) },
          { companyId, sku: ILike(`%${search}%`) },
          { companyId, barcode: ILike(`%${search}%`) },
        ]
      : { companyId };

    const [items, totalItems] = await this.findAndCount({
      where,
      relations: {
        mainImage: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, totalItems };
  }

  async findPaginatedAll(params: { page: number; limit: number }) {
    const { page, limit } = params;

    const [items, totalItems] = await this.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, totalItems };
  }
}
