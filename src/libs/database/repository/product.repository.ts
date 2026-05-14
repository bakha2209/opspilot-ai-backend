import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { ProductEntity } from '../entity';

@Injectable()
export class ProductRepository extends OrmRepository<ProductEntity> {
  constructor(readonly dataSource: DataSource) {
    super(ProductEntity, dataSource, 'ProductRepository');
  }

  async findByCompanyId(companyId: string): Promise<ProductEntity[]> {
    return this.findItemMany({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<ProductEntity | null> {
    return this.findItemOne({
      where: { id, companyId },
    });
  }

  async findBySkuAndCompanyId(
    sku: string,
    companyId: string,
  ): Promise<ProductEntity | null> {
    return this.findItemOne({
      where: { sku, companyId },
    });
  }
}
