import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { CompanyIntegrationEntity } from '../entity';

@Injectable()
export class CompanyIntegrationRepository extends OrmRepository<CompanyIntegrationEntity> {
  constructor(readonly dataSource: DataSource) {
    super(CompanyIntegrationEntity, dataSource, 'CompanyIntegrationRepository');
  }

  async findByCompanyId(companyId: string) {
    return this.findItemOne({
      where: { companyId },
    });
  }
}
