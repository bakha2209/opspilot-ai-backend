import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';

@Entity('uploaded_files')
export class UploadedFileEntity extends BaseEntity {
  @Column({
    name: 'company_id',
    type: 'uuid',
    nullable: true,
  })
  companyId?: string | null;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;

  @Column({
    name: 'uploaded_by',
    type: 'uuid',
    nullable: true,
  })
  uploadedBy?: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedUser?: UserEntity;

  @Column({
    name: 'original_name',
    length: 255,
  })
  originalName!: string;

  @Column({
    name: 'stored_name',
    length: 255,
  })
  storedName!: string;

  @Column({
    name: 'mime_type',
    length: 255,
  })
  mimeType!: string;

  @Column({
    name: 'file_size',
    type: 'bigint',
  })
  fileSize!: number;

  @Column({
    name: 'storage_type',
    length: 50,
  })
  storageType!: string;

  @Column({
    name: 'file_path',
    type: 'text',
  })
  filePath!: string;

  @Column({
    name: 'file_url',
    type: 'text',
  })
  fileUrl!: string;
}
