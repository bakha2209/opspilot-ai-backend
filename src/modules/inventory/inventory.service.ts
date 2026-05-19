import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  InventoryEntity,
  NotificationType,
  StockMovementEntity,
  StockMovementType,
} from '../../libs/database/entity';
import {
  InventoryRepository,
  ProductRepository,
  StockMovementRepository,
  WarehouseRepository,
} from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { StockMovementInputDto } from './dto/stock-movement-input.dto';
import { apiSuccess } from '../../common/utils/api-response.utils';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from '../events/events.service';
import { EventName } from '../events/constants/event-name.constant';
import { ReorderRequestsService } from '../reorder-requests/reorder-requests.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryRepository: InventoryRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly productRepository: ProductRepository,
    private readonly notificationsService: NotificationsService,
    private readonly eventsService: EventsService,
    private readonly reorderRequestsService: ReorderRequestsService,
  ) {}

  async findAll(currentUser: AuthPayload) {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const inventory = await this.inventoryRepository.findItemMany({
        relations: { warehouse: true, product: true },
        order: { createdAt: 'DESC' },
      });

      return apiSuccess('Inventory retrieved successfully', inventory);
    }

    const companyId = this.getCompanyIdOrThrow(currentUser);
    const inventory = await this.inventoryRepository.findByCompanyId(companyId);

    return apiSuccess('Inventory retrieved successfully', inventory);
  }

  private async checkLowStockAndNotify(
    companyId: string,
    warehouseId: string,
    productId: string,
    currentQuantity: number,
  ) {
    const product = await this.productRepository.findByIdAndCompanyId(
      productId,
      companyId,
    );

    if (!product) return;

    if (currentQuantity > product.safetyStock) return;

    const warehouse = await this.warehouseRepository.findByIdAndCompanyId(
      warehouseId,
      companyId,
    );

    const metadata = {
      productId,
      productName: product.name,
      sku: product.sku,
      warehouseId,
      warehouseName: warehouse?.name ?? null,
      currentQuantity,
      safetyStock: product.safetyStock,
    };

    const notification =
      await this.notificationsService.createSystemNotification({
        companyId,
        type: NotificationType.LOW_STOCK,
        title: 'Low stock detected',
        message: `${product.name} is below or equal to safety stock. Current quantity: ${currentQuantity}, safety stock: ${product.safetyStock}.`,
        metadata,
      });

      await this.reorderRequestsService.createAutomaticLowStockRequest({
        companyId,
        warehouseId,
        productId,
        currentQuantity,
        safetyStock: product.safetyStock,
      });

    await this.eventsService.publish(
      EventName.LOW_STOCK_DETECTED,
      {
        notificationId: notification.id,
        ...metadata,
      },
      {
        companyId,
      },
    );
  }

  async stockIn(currentUser: AuthPayload, dto: StockMovementInputDto) {
    return this.applyStockMovement(
      currentUser,
      dto,
      StockMovementType.STOCK_IN,
    );
  }

  async stockOut(currentUser: AuthPayload, dto: StockMovementInputDto) {
    return this.applyStockMovement(
      currentUser,
      dto,
      StockMovementType.STOCK_OUT,
    );
  }

  async adjust(currentUser: AuthPayload, dto: AdjustInventoryDto) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    await this.validateWarehouseAndProduct(
      companyId,
      dto.warehouseId,
      dto.productId,
    );

    return this.dataSource.transaction(async (manager) => {
      let inventory = await manager.getRepository(InventoryEntity).findOne({
        where: {
          companyId,
          warehouseId: dto.warehouseId,
          productId: dto.productId,
        },
      });

      if (!inventory) {
        inventory = manager.getRepository(InventoryEntity).create({
          companyId,
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          quantity: 0,
        });
      }

      const beforeQuantity = inventory.quantity;
      const afterQuantity = dto.quantity;

      inventory.quantity = afterQuantity;

      const savedInventory = await manager
        .getRepository(InventoryEntity)
        .save(inventory);

      const movement = manager.getRepository(StockMovementEntity).create({
        companyId,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        inventoryId: savedInventory.id,
        userId: currentUser.sub,
        type: StockMovementType.ADJUSTMENT,
        quantity: Math.abs(afterQuantity - beforeQuantity),
        beforeQuantity,
        afterQuantity,
        reason: dto.reason,
        memo: dto.memo,
      });

      const savedMovement = await manager
        .getRepository(StockMovementEntity)
        .save(movement);

      await this.eventsService.publish(
        EventName.STOCK_MOVEMENT_CREATED,
        {
          movementId: savedMovement.id,
          inventoryId: savedInventory.id,
          warehouseId: savedInventory.warehouseId,
          productId: savedInventory.productId,
          type: StockMovementType.ADJUSTMENT,
          quantity: Math.abs(afterQuantity - beforeQuantity),
          beforeQuantity,
          afterQuantity,
          reason: dto.reason ?? null,
        },
        {
          companyId,
          actorId: currentUser.sub,
        },
      );

      await this.checkLowStockAndNotify(
        companyId,
        savedInventory.warehouseId,
        savedInventory.productId,
        savedInventory.quantity,
      );

      return apiSuccess('Inventory adjusted successfully', savedInventory);
    });
  }

  private async applyStockMovement(
    currentUser: AuthPayload,
    dto: StockMovementInputDto,
    type: StockMovementType.STOCK_IN | StockMovementType.STOCK_OUT,
  ) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    await this.validateWarehouseAndProduct(
      companyId,
      dto.warehouseId,
      dto.productId,
    );

    return this.dataSource.transaction(async (manager) => {
      let inventory = await manager.getRepository(InventoryEntity).findOne({
        where: {
          companyId,
          warehouseId: dto.warehouseId,
          productId: dto.productId,
        },
      });

      if (!inventory) {
        inventory = manager.getRepository(InventoryEntity).create({
          companyId,
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          quantity: 0,
        });
      }

      const beforeQuantity = inventory.quantity;

      const afterQuantity =
        type === StockMovementType.STOCK_IN
          ? beforeQuantity + dto.quantity
          : beforeQuantity - dto.quantity;

      if (afterQuantity < 0) {
        throw new BadRequestException('Insufficient inventory quantity');
      }

      inventory.quantity = afterQuantity;

      const savedInventory = await manager
        .getRepository(InventoryEntity)
        .save(inventory);

      const movement = manager.getRepository(StockMovementEntity).create({
        companyId,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        inventoryId: savedInventory.id,
        userId: currentUser.sub,
        type,
        quantity: dto.quantity,
        beforeQuantity,
        afterQuantity,
        reason: dto.reason,
        memo: dto.memo,
      });

      const savedMovement = await manager
        .getRepository(StockMovementEntity)
        .save(movement);

      await this.eventsService.publish(
        EventName.STOCK_MOVEMENT_CREATED,
        {
          movementId: savedMovement.id,
          inventoryId: savedInventory.id,
          warehouseId: savedInventory.warehouseId,
          productId: savedInventory.productId,
          type,
          quantity: dto.quantity,
          beforeQuantity,
          afterQuantity,
          reason: dto.reason ?? null,
        },
        {
          companyId,
          actorId: currentUser.sub,
        },
      );

      await this.checkLowStockAndNotify(
        companyId,
        savedInventory.warehouseId,
        savedInventory.productId,
        savedInventory.quantity,
      );

      return apiSuccess('Stock movement applied successfully', savedInventory);
    });
  }

  private async validateWarehouseAndProduct(
    companyId: string,
    warehouseId: string,
    productId: string,
  ) {
    const warehouse = await this.warehouseRepository.findByIdAndCompanyId(
      warehouseId,
      companyId,
    );

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in your company');
    }

    const product = await this.productRepository.findByIdAndCompanyId(
      productId,
      companyId,
    );

    if (!product) {
      throw new NotFoundException('Product not found in your company');
    }
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
