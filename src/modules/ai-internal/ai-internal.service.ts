import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InventoryRepository,
  ReorderRequestRepository,
  StockMovementRepository,
  WarehouseRepository,
  ProductRepository,
  NotificationRepository,
} from '../../libs/database/repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAiReorderActionDto } from './dto/create-ai-reorder-action.dto';
import { ReorderRequestEntity, ReorderRequestStatus } from '../../libs/database/entity/reorder-request.entity';
import { AuditAction } from '../audit-logs/constants/audit-aution.constant';
import { NotificationType } from '../../libs/database/entity/notification.entity';
import { EventName } from '../events/constants/event-name.constant';

@Injectable()
export class AiInternalService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly reorderRequestRepository: ReorderRequestRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly productRepository: ProductRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationsService: NotificationsService,
    private readonly eventsService: EventsService,
    private readonly auditLogsService: AuditLogsService,
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

  async createReorderAction(dto: CreateAiReorderActionDto) {
    const product = await this.productRepository.findByIdAndCompanyId(
      dto.productId,
      dto.companyId,
    );

    if (!product) {
      throw new NotFoundException('Product not found in company');
    }

    const warehouse = await this.warehouseRepository.findByIdAndCompanyId(
      dto.warehouseId,
      dto.companyId,
    );

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in company');
    }

    const inventory = await this.inventoryRepository.findByWarehouseAndProduct(
      dto.companyId,
      dto.warehouseId,
      dto.productId,
    );

    if (!inventory) {
      throw new NotFoundException(
        'Inventory not found for product and warehouse',
      );
    }

    const existing = await this.reorderRequestRepository.findPendingByProduct(
      dto.companyId,
      dto.warehouseId,
      dto.productId,
    );

    if (existing) {
      throw new ConflictException('Pending reorder request already exists');
    }

    const reorder = await this.reorderRequestRepository.createAndSaveItem({
      companyId: dto.companyId,
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      requestedByUserId: null,
      currentQuantity: inventory.quantity,
      safetyStock: product.safetyStock,
      recommendedQuantity: dto.recommendedQuantity,
      aiReason:
        dto.reason ??
        `AI created reorder request for ${product.name}. Current quantity: ${inventory.quantity}, safety stock: ${product.safetyStock}.`,
      status: ReorderRequestStatus.PENDING,
      memo: 'Created by AI copilot',
    } as Partial<ReorderRequestEntity>);

    await this.auditLogsService.create({
      companyId: dto.companyId,
      userId: null,
      action: AuditAction.REORDER_CREATED ?? 'REORDER_CREATED',
      resourceType: 'ReorderRequest',
      resourceId: reorder.id,
      beforeData: null,
      afterData: {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        currentQuantity: inventory.quantity,
        safetyStock: product.safetyStock,
        recommendedQuantity: dto.recommendedQuantity,
        reason: dto.reason ?? null,
        source: 'AI_COPILOT',
      },
    });

    await this.notificationsService.createSystemNotification({
      companyId: dto.companyId,
      type: NotificationType.REORDER,
      title: 'AI reorder request created',
      message: `AI created reorder request for ${product.name}. Recommended quantity: ${dto.recommendedQuantity}.`,
      metadata: {
        reorderRequestId: reorder.id,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        productId: product.id,
        productName: product.name,
        recommendedQuantity: dto.recommendedQuantity,
        source: 'AI_COPILOT',
      },
    });

    await this.eventsService.publish(
      EventName.REORDER_REQUEST_CREATED,
      {
        reorderRequestId: reorder.id,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        recommendedQuantity: dto.recommendedQuantity,
        source: 'AI_COPILOT',
      },
      {
        companyId: dto.companyId,
      },
    );

    return {
      success: true,
      reorderRequestId: reorder.id,
      status: reorder.status,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
      },
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
      },
      currentQuantity: inventory.quantity,
      safetyStock: product.safetyStock,
      recommendedQuantity: dto.recommendedQuantity,
    };
  }
}
