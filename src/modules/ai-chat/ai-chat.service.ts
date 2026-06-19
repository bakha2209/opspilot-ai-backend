import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';


import {
  AiConversationEntity,
  AiMessageEntity,
} from '../../libs/database/entity';

import {
  AiConversationRepository,
  AiMessageRepository,
} from '../../libs/database/repository';

import { AuthPayload } from '../auth/types/auth-payload.type';

import { CreateConversationDto } from './dto/create-conversation.dto';
import { ChatDto } from './dto/chat.dto';
import { AiClientService } from './services/ai-client.service';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class AiChatService {
  constructor(
    private readonly aiConversationRepository: AiConversationRepository,
    private readonly aiMessageRepository: AiMessageRepository,
    private readonly aiClientService: AiClientService,
  ) {}

  async createConversation(
    currentUser: AuthPayload,
    dto: CreateConversationDto,
  ) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const conversation = await this.aiConversationRepository.createAndSaveItem({
      companyId,
      userId: currentUser.sub,
      title: dto.title,
      lastMessageAt: new Date(),
    } as Partial<AiConversationEntity>);

    return apiSuccess('Conversation created successfully', conversation);
  }

  async getConversations(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const conversations = await this.aiConversationRepository.findByUser(
      companyId,
      currentUser.sub,
    );

    return apiSuccess('Conversations retrieved successfully', conversations);
  }

  async getMessages(currentUser: AuthPayload, conversationId: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const conversation = await this.aiConversationRepository.findByIdAndUser(
      conversationId,
      companyId,
      currentUser.sub,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages =
      await this.aiMessageRepository.findConversationMessages(conversationId);

    return apiSuccess('Messages retrieved successfully', messages);
  }

  async chat(currentUser: AuthPayload, dto: ChatDto) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const conversation = await this.aiConversationRepository.findByIdAndUser(
      dto.conversationId,
      companyId,
      currentUser.sub,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.aiMessageRepository.createAndSaveItem({
      conversationId: conversation.id,
      role: 'user',
      content: dto.message,
    } as Partial<AiMessageEntity>);

    const history = await this.aiMessageRepository.findLastMessages(
      conversation.id,
      20,
    );

    const aiResponse = await this.aiClientService.chat({
      company_id: companyId,
      user_id: currentUser.sub,
      conversation_id: conversation.id,
      message: dto.message,

      history: history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    await this.aiMessageRepository.createAndSaveItem({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.answer,
    } as Partial<AiMessageEntity>);

    conversation.lastMessageAt = new Date();

    await this.aiConversationRepository.saveItem(conversation);

    return apiSuccess('AI response generated successfully', aiResponse);
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }

  async chatStream(currentUser: AuthPayload, dto: ChatDto) {
  const companyId = this.getCompanyIdOrThrow(currentUser);

  const conversation =
    await this.aiConversationRepository.findByIdAndUser(
      dto.conversationId,
      companyId,
      currentUser.sub,
    );

  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }

  await this.aiMessageRepository.createAndSaveItem({
    conversationId: conversation.id,
    role: 'user',
    content: dto.message,
  } as Partial<AiMessageEntity>);

  const history = await this.aiMessageRepository.findLastMessages(
    conversation.id,
    20,
  );

  return this.aiClientService.chatStream({
    company_id: companyId,
    user_id: currentUser.sub,
    conversation_id: conversation.id,
    message: dto.message,
    history: history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });
}

async saveAssistantMessage(
  conversationId: string,
  content: string,
) {
  await this.aiMessageRepository.createAndSaveItem({
    conversationId,
    role: 'assistant',
    content,
  } as Partial<AiMessageEntity>);
}
}
