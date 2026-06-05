import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CompanyEntity } from './company.entity';

@Entity('company_integrations')
export class CompanyIntegrationEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid', unique: true })
  companyId!: string;

  @OneToOne(() => CompanyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'telegram_enabled', type: 'boolean', default: false })
  telegramEnabled!: boolean;

  @Column({
    name: 'telegram_chat_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  telegramChatId?: string | null;
}
