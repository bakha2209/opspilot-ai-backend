import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { AiCopilotController } from './ai-copilot.controller';
import { AiCopilotService } from './ai-copilot.service';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [AiCopilotController],
  providers: [AiCopilotService],
})
export class AiCopilotModule {}
