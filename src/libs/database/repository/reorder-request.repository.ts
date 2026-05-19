import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { ReorderRequestEntity, ReorderRequestStatus } from '../entity';

@Injectable()
export class ReorderRequestRepository extends OrmRepository<ReorderRequestEntity> {
  constructor(readonly dataSource: DataSource) {
    super(ReorderRequestEntity, dataSource, 'ReorderRequestRepository');
  }

  async findByCompanyId(companyId: string) {
    return this.findItemMany({
      where: { companyId },
      relations: {
        warehouse: true,
        product: true,
        requestedByUser: true,
        approvedByUser: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findPendingByProduct(
    companyId: string,
    warehouseId: string,
    productId: string,
  ) {
    return this.findItemOne({
      where: {
        companyId,
        warehouseId,
        productId,
        status: ReorderRequestStatus.PENDING,
      },
    });
  }

  async findByIdAndCompanyId(id: string, companyId: string) {
    return this.findItemOne({
      where: { id, companyId },
      relations: {
        warehouse: true,
        product: true,
        requestedByUser: true,
        approvedByUser: true,
      },
    });
  }
}
