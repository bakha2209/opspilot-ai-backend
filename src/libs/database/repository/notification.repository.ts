import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, MoreThanOrEqual } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { NotificationEntity, NotificationType } from '../entity';

@Injectable()
export class NotificationRepository extends OrmRepository<NotificationEntity> {
  constructor(readonly dataSource: DataSource) {
    super(NotificationEntity, dataSource, 'NotificationRepository');
  }

  async findByCompanyId(companyId: string): Promise<NotificationEntity[]> {
    return this.findItemMany({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadByCompanyId(
    companyId: string,
  ): Promise<NotificationEntity[]> {
    return this.findItemMany({
      where: { companyId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<NotificationEntity | null> {
    return this.findItemOne({
      where: { id, companyId },
    });
  }

  async countUnreadByCompanyId(companyId: string): Promise<number> {
    return this.count({
      where: {
        companyId,
        isRead: false,
      },
    });
  }

  async findRecentUnresolvedAiAlert(companyId: string, since: Date) {
    return this.findItemOne({
      where: {
        companyId,
        type: NotificationType.AI_ALERT,
        resolvedAt: IsNull(),
        createdAt: MoreThanOrEqual(since),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
