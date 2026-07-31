import { Injectable } from '@nestjs/common';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { AuditLogEntity } from '../entity';
import { AuditLogQueryDto } from '../../../modules/audit-logs/dto/audit-log-query.dto';

@Injectable()
export class AuditLogRepository extends OrmRepository<AuditLogEntity> {
  constructor(readonly dataSource: DataSource) {
    super(AuditLogEntity, dataSource, 'AuditLogRepository');
  }

  async findByCompanyId(companyId: string): Promise<AuditLogEntity[]> {
    return this.findItemMany({
      where: { companyId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByResource(params: {
    companyId: string;
    resourceType: string;
    resourceId: string;
  }): Promise<AuditLogEntity[]> {
    return this.findItemMany({
      where: {
        companyId: params.companyId,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginatedByCompanyId(params: {
    companyId: string;
    query: AuditLogQueryDto;
  }) {
    const { companyId, query } = params;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<AuditLogEntity> = {
      companyId,
    };

    if (query.action) {
      where.action = query.action;
    }

    if (query.resourceType) {
      where.resourceType = query.resourceType;
    }

    if (query.resourceId) {
      where.resourceId = query.resourceId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate && query.endDate) {
      where.createdAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
    }

    const [items, totalItems] = await this.findAndCount({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, totalItems };
  }

  async findPaginatedAll(query: AuditLogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<AuditLogEntity> = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.resourceType) {
      where.resourceType = query.resourceType;
    }

    if (query.resourceId) {
      where.resourceId = query.resourceId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate && query.endDate) {
      where.createdAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      where.createdAt = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      where.createdAt = LessThanOrEqual(new Date(query.endDate));
    }

    const [items, totalItems] = await this.findAndCount({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, totalItems };
  }

  async findFailedBlockchainLogs(
    companyId?: string,
  ): Promise<AuditLogEntity[]> {
    return this.findItemMany({
      where: {
        ...(companyId ? { companyId } : {}),
        blockchainStatus: 'FAILED',
        blockchainVerified: false,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async getBlockchainStatistics(companyId?: string) {
    const companyWhere = companyId ? { companyId } : {};

    const [total, verified, pending, failed] = await Promise.all([
      this.count({ where: companyWhere }),

      this.count({
        where: {
          ...companyWhere,
          blockchainVerified: true,
        },
      }),

      this.count({
        where: {
          ...companyWhere,
          blockchainStatus: 'PENDING',
        },
      }),

      this.count({
        where: {
          ...companyWhere,
          blockchainStatus: 'FAILED',
        },
      }),
    ]);

    return {
      total,
      verified,
      pending,
      failed,
      successRate:
        total === 0 ? 100 : Number(((verified / total) * 100).toFixed(2)),
    };
  }
}
