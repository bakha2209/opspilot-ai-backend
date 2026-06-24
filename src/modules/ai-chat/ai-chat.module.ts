import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../libs/database/database.module";
import { AiChatController } from "./ai-chat.controller";
import { AiChatService } from "./ai-chat.service";
import { AiClientService } from "./services/ai-client.service";
import { SecurityModule } from "../../libs/core/security";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [DatabaseModule, SecurityModule,AuditLogsModule],
  controllers: [AiChatController],
  providers: [AiChatService, AiClientService],
})
export class AiChatModule {}
