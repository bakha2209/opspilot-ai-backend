import { Injectable } from '@nestjs/common';
import {
  InventoryRepository,
  ReorderRequestRepository,
  StockMovementRepository,
  WarehouseRepository,
  ProductRepository,
  NotificationRepository,
} from '../../libs/database/repository';

@Injectable()
export class AiInternalService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly reorderRequestRepository: ReorderRequestRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly productRepository: ProductRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}
  async dashboardSummary(companyId: string) {
    const [
      totalWarehouses,
      totalProducts,
      totalInventoryItems,
      lowStockItems,
      pendingReorders,
      unreadNotifications,
    ] = await Promise.all([
      this.warehouseRepository.countByCompanyId(companyId),
      this.productRepository.countByCompanyId(companyId),
      this.inventoryRepository.countByCompanyId(companyId),
      this.inventoryRepository.findLowStockByCompanyId(companyId),
      this.reorderRequestRepository.countPendingByCompanyId(companyId),
      this.notificationRepository.countUnreadByCompanyId(companyId),
    ]);

    return {
      totalWarehouses,
      totalProducts,
      totalInventoryItems,
      lowStockCount: lowStockItems.length,
      pendingReorders,
      unreadNotifications,
    };
  }

  async lowStock(companyId: string) {
    const items =
      await this.inventoryRepository.findLowStockByCompanyId(companyId);

    return {
      items,
    };
  }

  async pendingReorders(companyId: string) {
    const items =
      await this.reorderRequestRepository.findPendingByCompanyId(companyId);

    return {
      items,
    };
  }

  async recentStockMovements(companyId: string, limit = 20) {
    const items = await this.stockMovementRepository.findRecentByCompanyId(
      companyId,
      limit,
    );

    return {
      items,
    };
  }
}
