import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsUUID()
  companyId?: string | null;

  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @IsString()
  @MaxLength(100)
  action!: string;

  @IsString()
  @MaxLength(100)
  resourceType!: string;

  @IsOptional()
  @IsUUID()
  resourceId?: string | null;

  @IsOptional()
  beforeData?: Record<string, any> | null;

  @IsOptional()
  afterData?: Record<string, any> | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ipAddress?: string | null;

  @IsOptional()
  @IsString()
  userAgent?: string | null;
}
