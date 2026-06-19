import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrmRepository } from '../../core/typeorm/orm.repository';
import { AiMessageEntity } from '../entity/ai-message.entity';


@Injectable()
export class AiMessageRepository extends OrmRepository<AiMessageEntity> {
  constructor(readonly dataSource: DataSource) {
    super(AiMessageEntity, dataSource, 'AiMessageRepository');
  }

  async findConversationMessages(conversationId: string) {
    return this.findItemMany({
      where: {
        conversationId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findLastMessages(conversationId: string, limit = 20) {
    const items = await this.findItemMany({
      where: {
        conversationId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return items.reverse();
  }
}
