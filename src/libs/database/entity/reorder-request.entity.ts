import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyEntity } from './company.entity';
import { ProductEntity } from './product.entity';
import { UserEntity } from './user.entity';
import { WarehouseEntity } from './warehouse.entity';

export enum ReorderRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ORDERED = 'ORDERED',
}

@Entity('reorder_requests')
export class ReorderRequestEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: WarehouseEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @Column({
    name: 'requested_by_user_id',
    type: 'uuid',
    nullable: true,
  })
  requestedByUserId?: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser?: UserEntity | null;

  @Column({
    name: 'approved_by_user_id',
    type: 'uuid',
    nullable: true,
  })
  approvedByUserId?: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser?: UserEntity | null;

  @Column({ name: 'current_quantity', type: 'integer' })
  currentQuantity!: number;

  @Column({ name: 'safety_stock', type: 'integer' })
  safetyStock!: number;

  @Column({ name: 'recommended_quantity', type: 'integer' })
  recommendedQuantity!: number;

  @Column({
    name: 'ai_reason',
    type: 'text',
    nullable: true,
  })
  aiReason?: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ReorderRequestStatus,
    default: ReorderRequestStatus.PENDING,
  })
  status!: ReorderRequestStatus;

  @Column({
    name: 'memo',
    type: 'text',
    nullable: true,
  })
  memo?: string | null;
}
