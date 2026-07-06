import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditLogEntity } from '../../libs/database/entity';
import { AuditLogRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { BlockchainStatus } from './constants/blokchain-status.constant';
import { createSha256Hash } from '../../libs/core/utils/hash.util';
import * as crypto from 'crypto';
import { BlockchainPublisherService } from '../../blockchain/services/blkchain-publisher.service';
import { BlockchainService } from '../../blockchain/services/blokchain.service';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly blockchainService: BlockchainService,
    private readonly blockchainPublisherService: BlockchainPublisherService,
  ) {}

  async create(dto: CreateAuditLogDto) {
    const eventId = `audit-${crypto.randomUUID()}`;

    const payload = {
      companyId: dto.companyId ?? null,
      userId: dto.userId ?? null,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId ?? null,
      beforeData: dto.beforeData ?? null,
      afterData: dto.afterData ?? null,
    };

    const payloadHash = createSha256Hash(payload);

    const auditLog = await this.auditLogRepository.createAndSaveItem({
      companyId: dto.companyId ?? null,
      userId: dto.userId ?? null,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId ?? null,
      beforeData: dto.beforeData ?? null,
      afterData: dto.afterData ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
      blockchainEventId: eventId,
      blockchainStatus: BlockchainStatus.PENDING,
      blockchainVerified: false,
    } as Partial<AuditLogEntity>);

    await this.blockchainPublisherService.publishAuditAnchor({
      auditLogId: auditLog.id,
      eventId,
      companyId: dto.companyId ?? '00000000-0000-0000-0000-000000000000',
      eventType: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId ?? auditLog.id,
      payloadHash,
      createdAt: auditLog.createdAt.toISOString(),
    });

    return auditLog;
  }

  async findAll(currentUser: AuthPayload, query: AuditLogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const { items, totalItems } =
        await this.auditLogRepository.findPaginatedAll(query);

      return apiSuccess('Audit logs retrieved successfully', {
        items,
        meta: buildPaginationMeta({ page, limit, totalItems }),
      });
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);

    const { items, totalItems } =
      await this.auditLogRepository.findPaginatedByCompanyId({
        companyId,
        query,
      });

    return apiSuccess('Audit logs retrieved successfully', {
      items,
      meta: buildPaginationMeta({ page, limit, totalItems }),
    });
  }

  async findByResource(
    currentUser: AuthPayload,
    resourceType: string,
    resourceId: string,
  ) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const logs = await this.auditLogRepository.findByResource({
      companyId,
      resourceType,
      resourceId,
    });

    return apiSuccess('Resource audit logs retrieved successfully', logs);
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }

  async verifyAuditLog(id: string) {
    const audit = await this.auditLogRepository.findOne({
      where: { id },
    });

    if (!audit || !audit.blockchainEventId) {
      throw new Error('Audit log not anchored');
    }

    const payload = {
      companyId: audit.companyId,
      userId: audit.userId,
      action: audit.action,
      resourceType: audit.resourceType,
      resourceId: audit.resourceId,
      beforeData: audit.beforeData,
      afterData: audit.afterData,
    };

    const payloadHash = createSha256Hash(payload);

    return this.blockchainService.verifyAuditAnchor(
      audit.blockchainEventId,
      payloadHash,
    );
  }
}
