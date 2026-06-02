import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserRole } from '../../common/enums/user-role.enum';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/types/auth-payload.type';
import { CopilotChatDto } from './dto/copilot-chat.dto';
import { AiCopilotService } from './ai-copilot.service';

@ApiTags('AI Copilot')
@ApiBearerAuth()
@Controller('ai-copilot')
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @Post('chat')
  @Auth(UserRole.COMPANY_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({
    summary: 'Chat with AI Copilot',
  })
  chat(@CurrentUser() currentUser: AuthPayload, @Body() dto: CopilotChatDto) {
    return this.aiCopilotService.chat(currentUser, dto);
  }
}
