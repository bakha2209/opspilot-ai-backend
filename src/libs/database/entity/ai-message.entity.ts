import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity('ai_messages')
export class AiMessageEntity extends BaseEntity {
  @Column({
    name: 'conversation_id',
    type: 'uuid',
  })
  conversationId!: string;

  @Column({
    length: 20,
  })
  role!: string;

  @Column({
    type: 'text',
  })
  content!: string;
}
