import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { StockMovementEntity } from '../entity';

@Injectable()
export class StockMovementRepository extends OrmRepository<StockMovementEntity> {
  constructor(readonly dataSource: DataSource) {
    super(StockMovementEntity, dataSource, 'StockMovementRepository');
  }

  async findByCompanyId(companyId: string): Promise<StockMovementEntity[]> {
    return this.findItemMany({
      where: { companyId },
      relations: {
        warehouse: true,
        product: true,
        user: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByProductId(
    companyId: string,
    productId: string,
  ): Promise<StockMovementEntity[]> {
    return this.findItemMany({
      where: { companyId, productId },
      relations: {
        warehouse: true,
        product: true,
        user: true,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
