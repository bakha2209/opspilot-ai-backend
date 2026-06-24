import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { AiConversationEntity } from '../entity/ai-conversation.entity';

@Injectable()
export class AiConversationRepository extends OrmRepository<AiConversationEntity> {
  constructor(readonly dataSource: DataSource) {
    super(AiConversationEntity, dataSource, 'AiConversationRepository');
  }

  async findByUser(companyId: string, userId: string) {
    return this.findItemMany({
      where: {
        companyId,
        userId,
      },
      order: {
        lastMessageAt: 'DESC',
      },
    });
  }

  async findByIdAndUser(
    conversationId: string,
    companyId: string,
    userId: string,
  ) {
    return this.findItemOne({
      where: {
        id: conversationId,
        companyId,
        userId,
      },
    });
  }

  async findPaginatedByUser(params: {
    companyId: string;
    userId: string;
    page: number;
    limit: number;
  }) {
    const { companyId, userId, page, limit } = params;

    const [items, totalItems] = await this.findAndCount({
      where: {
        companyId,
        userId,
      },
      order: {
        lastMessageAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      totalItems,
    };
  }
}
