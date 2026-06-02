import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { BaseEntity } from './base.entity';
import { CompanyEntity } from './company.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  INVITED = 'INVITED',
  BLOCKED = 'BLOCKED',
}

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ name: 'email', type: 'varchar', length: 150, unique: true })
  email!: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name!: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.WAREHOUSE_STAFF,
  })
  role!: UserRole;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId?: string | null;

  @ManyToOne(() => CompanyEntity, (company) => company.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity | null;
}