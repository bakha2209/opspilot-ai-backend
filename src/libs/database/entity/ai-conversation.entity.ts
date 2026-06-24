import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('ai_conversations')
export class AiConversationEntity extends BaseEntity {
  @Column({
    name: 'company_id',
    type: 'uuid',
  })
  companyId!: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @Column({
    length: 255,
  })
  title!: string;

  @Column({
    name: 'last_message_at',
    type: 'timestamptz',
  })
  lastMessageAt!: Date;

  @Column({
    name: 'last_message',
    type: 'text',
    nullable: true,
  })
  lastMessage?: string | null;
}
