import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyEntity } from './company.entity';
import { InventoryEntity } from './inventory.entity';
import { ProductEntity } from './product.entity';
import { UserEntity } from './user.entity';
import { WarehouseEntity } from './warehouse.entity';

export enum StockMovementType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('stock_movements')
export class StockMovementEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: WarehouseEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: ProductEntity;

  @Column({ name: 'inventory_id', type: 'uuid', nullable: true })
  inventoryId?: string | null;

  @ManyToOne(() => InventoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inventory_id' })
  inventory?: InventoryEntity | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({
    name: 'type',
    type: 'enum',
    enum: StockMovementType,
  })
  type!: StockMovementType;

  @Column({ name: 'quantity', type: 'integer' })
  quantity!: number;

  @Column({ name: 'before_quantity', type: 'integer' })
  beforeQuantity!: number;

  @Column({ name: 'after_quantity', type: 'integer' })
  afterQuantity!: number;

  @Column({ name: 'reason', type: 'varchar', length: 255, nullable: true })
  reason?: string | null;

  @Column({ name: 'memo', type: 'text', nullable: true })
  memo?: string | null;
}
