import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { WarehouseEntity } from '../entity';

@Injectable()
export class WarehouseRepository extends OrmRepository<WarehouseEntity> {
  constructor(readonly dataSource: DataSource) {
    super(WarehouseEntity, dataSource, 'WarehouseRepository');
  }

  async findByCompanyId(companyId: string): Promise<WarehouseEntity[]> {
    return this.findItemMany({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<WarehouseEntity | null> {
    return this.findItemOne({
      where: { id, companyId },
    });
  }

  async findByCodeAndCompanyId(
    code: string,
    companyId: string,
  ): Promise<WarehouseEntity | null> {
    return this.findItemOne({
      where: { code, companyId },
    });
  }
}
