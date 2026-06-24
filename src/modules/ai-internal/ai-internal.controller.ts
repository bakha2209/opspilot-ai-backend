import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AiInternalService } from './ai-internal.service';
import { AiToolRequestDto } from './dto/ai-tool-request.dto';
import { AiInternalGuard } from './guards/ai-internal.guard';
import { CreateAiReorderActionDto } from './dto/create-ai-reorder-action.dto';

@ApiTags('AI Internal')
@ApiHeader({
  name: 'x-ai-internal-key',
  description: 'Internal API key for Python AI service',
  required: true,
})
@Controller('internal/ai')
@UseGuards(AiInternalGuard)
export class AiInternalController {
  constructor(private readonly aiInternalService: AiInternalService) {}

  @Post('dashboard-summary')
  dashboardSummary(@Body() dto: AiToolRequestDto) {
    return this.aiInternalService.dashboardSummary(dto.companyId);
  }

  @Post('low-stock')
  lowStock(@Body() dto: AiToolRequestDto) {
    return this.aiInternalService.lowStock(dto.companyId);
  }

  @Post('pending-reorders')
  pendingReorders(@Body() dto: AiToolRequestDto) {
    return this.aiInternalService.pendingReorders(dto.companyId);
  }

  @Post('recent-stock-movements')
  recentStockMovements(@Body() dto: AiToolRequestDto) {
    return this.aiInternalService.recentStockMovements(
      dto.companyId,
      Number(dto.limit ?? 20),
    );
  }

  @Post('actions/create-reorder')
  createReorderAction(@Body() dto: CreateAiReorderActionDto) {
    return this.aiInternalService.createReorderAction(dto);
  }
}
