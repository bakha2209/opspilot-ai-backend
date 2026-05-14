import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { InventoryEntity } from '../entity';

@Injectable()
export class InventoryRepository extends OrmRepository<InventoryEntity> {
  constructor(readonly dataSource: DataSource) {
    super(InventoryEntity, dataSource, 'InventoryRepository');
  }

  async findByCompanyId(companyId: string): Promise<InventoryEntity[]> {
    return this.findItemMany({
      where: { companyId },
      relations: { warehouse: true, product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<InventoryEntity | null> {
    return this.findItemOne({
      where: { id, companyId },
      relations: { warehouse: true, product: true },
    });
  }

  async findByWarehouseAndProduct(
    companyId: string,
    warehouseId: string,
    productId: string,
  ): Promise<InventoryEntity | null> {
    return this.findItemOne({
      where: { companyId, warehouseId, productId },
      relations: { warehouse: true, product: true },
    });
  }
}
