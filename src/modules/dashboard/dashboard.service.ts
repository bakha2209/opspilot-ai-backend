import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  InventoryRepository,
  NotificationRepository,
  ProductRepository,
  ReorderRequestRepository,
  StockMovementRepository,
  WarehouseRepository,
} from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class DashboardService {
  constructor(
    private readonly warehouseRepository: WarehouseRepository,
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly reorderRequestRepository: ReorderRequestRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async summary(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const [
      totalWarehouses,
      totalProducts,
      totalInventoryItems,
      lowStockItems,
      pendingReorderCount,
      unreadNotificationCount,
    ] = await Promise.all([
      this.warehouseRepository.countByCompanyId(companyId),
      this.productRepository.countByCompanyId(companyId),
      this.inventoryRepository.countByCompanyId(companyId),
      this.inventoryRepository.findLowStockByCompanyId(companyId),
      this.reorderRequestRepository.countPendingByCompanyId(companyId),
      this.notificationRepository.countUnreadByCompanyId(companyId),
    ]);

    return apiSuccess('Dashboard summary retrieved successfully', {
      totalWarehouses,
      totalProducts,
      totalInventoryItems,
      lowStockCount: lowStockItems.length,
      pendingReorderCount,
      unreadNotificationCount,
    });
  }

  async lowStock(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const items =
      await this.inventoryRepository.findLowStockByCompanyId(companyId);

    return apiSuccess('Low stock items retrieved successfully', items);
  }

  async pendingReorders(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const items =
      await this.reorderRequestRepository.findPendingByCompanyId(companyId);

    return apiSuccess('Pending reorder requests retrieved successfully', items);
  }

  async recentStockMovements(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const items = await this.stockMovementRepository.findRecentByCompanyId(
      companyId,
      10,
    );

    return apiSuccess('Recent stock movements retrieved successfully', items);
  }

  async overview(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const [
      lowStockItems,
      pendingReorders,
      recentStockMovements,
      unreadNotificationCount,
    ] = await Promise.all([
      this.inventoryRepository.findLowStockByCompanyId(companyId),
      this.reorderRequestRepository.findPendingByCompanyId(companyId),
      this.stockMovementRepository.findRecentByCompanyId(companyId, 10),
      this.notificationRepository.countUnreadByCompanyId(companyId),
    ]);

    return apiSuccess('Dashboard overview retrieved successfully', {
      lowStockItems,
      pendingReorders,
      recentStockMovements,
      unreadNotificationCount,
    });
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
