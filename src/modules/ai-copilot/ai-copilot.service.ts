import { Injectable } from '@nestjs/common';
import { InventoryRepository } from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { CopilotChatDto } from './dto/copilot-chat.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class AiCopilotService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async chat(currentUser: AuthPayload, dto: CopilotChatDto) {
    const inventory = await this.inventoryRepository.findByCompanyId(
      currentUser.companyId!,
    );

    const lowStockItems = inventory.filter(
      (item) => item.product && item.quantity <= item.product.safetyStock,
    );

    return apiSuccess('AI response generated successfully', {
      answer:
        lowStockItems.length > 0
          ? `I found ${lowStockItems.length} low-stock products that may require reorder actions.`
          : 'No immediate inventory issues were detected.',
      recommendedActions:
        lowStockItems.length > 0
          ? [
              {
                type: 'VIEW_LOW_STOCK',
                label: 'Review low stock products',
                payload: {
                  count: lowStockItems.length,
                },
              },
            ]
          : [
              {
                type: 'NO_ACTION',
                label: 'No action required',
                payload: {},
              },
            ],
    });
  }
}
