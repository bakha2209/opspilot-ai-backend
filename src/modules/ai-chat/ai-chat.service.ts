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
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/constants/audit-aution.constant';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { AiConversationQueryDto } from './dto/ai-conversation-query.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class AiChatService {
  constructor(
    private readonly aiConversationRepository: AiConversationRepository,
    private readonly aiMessageRepository: AiMessageRepository,
    private readonly aiClientService: AiClientService,
    private readonly auditLogsService: AuditLogsService,
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

  async getConversations(
    currentUser: AuthPayload,
    query: AiConversationQueryDto,
  ) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { items, totalItems } =
      await this.aiConversationRepository.findPaginatedByUser({
        companyId,
        userId: currentUser.sub,
        page,
        limit,
      });

    return apiSuccess('Conversations retrieved successfully', {
      items,
      meta: buildPaginationMeta({
        page,
        limit,
        totalItems,
      }),
    });
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
      confirmed_action: dto.confirmedAction ?? null,
    });

    if (aiResponse.pending_action) {
      await this.auditLogsService.create({
        companyId,
        userId: currentUser.sub,
        action: AuditAction.AI_ACTION_REQUESTED,
        resourceType: 'AI_ACTION',
        resourceId: null,
        beforeData: null,
        afterData: aiResponse.pending_action,
      });
    }

    if (dto.confirmedAction) {
      await this.auditLogsService.create({
        companyId,
        userId: currentUser.sub,
        action: AuditAction.AI_ACTION_CONFIRMED,
        resourceType: 'AI_ACTION',
        resourceId: null,
        beforeData: null,
        afterData: dto.confirmedAction,
      });

      await this.auditLogsService.create({
        companyId,
        userId: currentUser.sub,
        action: AuditAction.AI_ACTION_EXECUTED,
        resourceType: 'AI_ACTION',
        resourceId: null,
        beforeData: dto.confirmedAction,
        afterData: aiResponse,
      });
    }

    await this.aiMessageRepository.createAndSaveItem({
      conversationId: conversation.id,
      role: 'assistant',
      content: aiResponse.answer,
    } as Partial<AiMessageEntity>);

    conversation.lastMessage =
      dto.message.length > 200 ? dto.message.slice(0, 200) : dto.message;
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

    return this.aiClientService.chatStream({
      company_id: companyId,
      user_id: currentUser.sub,
      conversation_id: conversation.id,
      message: dto.message,
      history: history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      confirmed_action: dto.confirmedAction ?? null,
    });
  }

  async saveAssistantMessage(conversationId: string, content: string) {
    await this.aiMessageRepository.createAndSaveItem({
      conversationId,
      role: 'assistant',
      content,
    } as Partial<AiMessageEntity>);
  }

  async updateConversation(
    currentUser: AuthPayload,
    conversationId: string,
    dto: UpdateConversationDto,
  ) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const conversation = await this.aiConversationRepository.findByIdAndUser(
      conversationId,
      companyId,
      currentUser.sub,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (dto.title !== undefined) {
      conversation.title = dto.title;
    }

    const saved = await this.aiConversationRepository.saveItem(conversation);

    return apiSuccess('Conversation updated successfully', saved);
  }

  async deleteConversation(currentUser: AuthPayload, conversationId: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const conversation = await this.aiConversationRepository.findByIdAndUser(
      conversationId,
      companyId,
      currentUser.sub,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.aiConversationRepository.softDeleteItem(conversation);

    return apiSuccess('Conversation deleted successfully', {
      id: conversationId,
    });
  }
}
