import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserRole } from '../../common/enums/user-role.enum';

import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';

import { AiChatService } from './ai-chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ChatDto } from './dto/chat.dto';

@ApiTags('AI Chat')
@ApiBearerAuth()
@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('conversations')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  createConversation(
    @CurrentUser() currentUser: AuthPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.aiChatService.createConversation(currentUser, dto);
  }

  @Get('conversations')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  getConversations(@CurrentUser() currentUser: AuthPayload) {
    return this.aiChatService.getConversations(currentUser);
  }

  @Get('conversations/:id/messages')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  getMessages(
    @CurrentUser() currentUser: AuthPayload,
    @Param('id') id: string,
  ) {
    return this.aiChatService.getMessages(currentUser, id);
  }

  @Post('chat')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  chat(@CurrentUser() currentUser: AuthPayload, @Body() dto: ChatDto) {
    return this.aiChatService.chat(currentUser, dto);
  }

  @Post('chat/stream')
@Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
@ApiOperation({ summary: 'Stream AI chat response' })
async chatStream(
  @CurrentUser() currentUser: AuthPayload,
  @Body() dto: ChatDto,
  @Res() res: Response,
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await this.aiChatService.chatStream(currentUser, dto);

  let fullResponse = '';

stream.on('data', (chunk) => {
  const text = chunk.toString();

  fullResponse += text;

  res.write(chunk);
});

 stream.on('end', async () => {
  try {
    const cleanContent = this.extractContent(fullResponse);
    await this.aiChatService.saveAssistantMessage(
      dto.conversationId,
      cleanContent,
    );
  } catch (error) {
    console.error(
      'Failed to save streamed AI response',
      error,
    );
  }

  res.end();
});

  stream.on('error', (error) => {
    res.write(`event: error\ndata: ${JSON.stringify(error.message)}\n\n`);
    res.end();
  });
}

 private extractContent(fullResponse: string): string {
    return fullResponse
      .split('\n')
      .filter(
        (line) =>
          line.startsWith('data: ') &&
          !line.includes('[DONE]'),
      )
      .map((line) => line.replace('data: ', ''))
      .join('');
  }
}
