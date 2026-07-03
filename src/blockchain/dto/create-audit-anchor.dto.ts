import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateAuditAnchorDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsNotEmpty()
  resourceType: string;

  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @IsString()
  @IsNotEmpty()
  payloadHash: string;

  @IsDateString()
  createdAt: string;
}
