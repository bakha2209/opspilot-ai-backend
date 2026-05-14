import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyEntity } from './company.entity';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('products')
export class ProductEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => CompanyEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: CompanyEntity;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'sku', type: 'varchar', length: 100 })
  sku: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description?: string | null;

  @Column({
    name: 'barcode',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  barcode?: string | null;

  @Column({
    name: 'unit',
    type: 'varchar',
    length: 30,
    default: 'EA',
  })
  unit: string;

  @Column({
    name: 'safety_stock',
    type: 'integer',
    default: 0,
  })
  safetyStock: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;
}
