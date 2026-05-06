import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { UserEntity } from '../entity';

@Injectable()
export class UserRepository extends OrmRepository<UserEntity> {
  constructor(readonly dataSource: DataSource) {
    super(UserEntity, dataSource, 'UserRepository');
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.findItemOne({
      where: { id },
      relations: { company: true },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findItemOne({
      where: { email },
      relations: { company: true },
    });
  }
}