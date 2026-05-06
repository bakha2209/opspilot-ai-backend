import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { CompanyEntity } from '../entity';

@Injectable()
export class CompanyRepository extends OrmRepository<CompanyEntity> {
  constructor(readonly dataSource: DataSource) {
    super(CompanyEntity, dataSource, 'CompanyRepository');
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    return this.findItemOne({
      where: { id },
      relations: { users: true },
    });
  }

  async findByEmail(email: string): Promise<CompanyEntity | null> {
    return this.findItemOne({
      where: { email },
    });
  }
}