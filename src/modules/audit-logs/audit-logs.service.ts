import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditLogEntity } from '../../libs/database/entity';
import { AuditLogRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async create(dto: CreateAuditLogDto) {
    return this.auditLogRepository.createAndSaveItem({
      companyId: dto.companyId ?? null,
      userId: dto.userId ?? null,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId ?? null,
      beforeData: dto.beforeData ?? null,
      afterData: dto.afterData ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
    } as Partial<AuditLogEntity>);
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
}
