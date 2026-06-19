import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { AiInternalController } from './ai-internal.controller';
import { AiInternalService } from './ai-internal.service';
import { AiInternalGuard } from './guards/ai-internal.guard';
import { SecurityModule } from '../../libs/core/security';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [AiInternalController],
  providers: [AiInternalService, AiInternalGuard],
})
export class AiInternalModule {}
