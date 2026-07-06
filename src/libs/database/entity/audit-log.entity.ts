import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
export class AuditLogEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId?: string | null;

  @ManyToOne(() => CompanyEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({ name: 'action', type: 'varchar', length: 100 })
  action!: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 100 })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId?: string | null;

  @Column({ name: 'before_data', type: 'jsonb', nullable: true })
  beforeData?: Record<string, any> | null;

  @Column({ name: 'after_data', type: 'jsonb', nullable: true })
  afterData?: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 100, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({
    name: 'blockchain_tx_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  blockchainTxId?: string | null;

  @Column({
    name: 'blockchain_status',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  blockchainStatus?: string | null;

  @Column({ name: 'blockchain_verified', type: 'boolean', default: false })
  blockchainVerified!: boolean;

  @Column({ name: 'blockchain_anchor_time', type: 'timestamp', nullable: true })
  blockchainAnchorTime?: Date | null;

  @Column({
    name: 'blockchain_event_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  blockchainEventId?: string | null;

  @Column({ name: 'blockchain_retry_count', type: 'integer', default: 0 })
  blockchainRetryCount!: number;

  @Column({ name: 'blockchain_last_error', type: 'text', nullable: true })
  blockchainLastError?: string | null;
}
