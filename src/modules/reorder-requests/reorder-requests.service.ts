import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventName } from '../events/constants/event-name.constant';
import { EventsService } from '../events/events.service';
import {
  NotificationType,
  ReorderRequestEntity,
  ReorderRequestStatus,
} from '../../libs/database/entity';
import {
  NotificationRepository,
  ProductRepository,
  ReorderRequestRepository,
  WarehouseRepository,
} from '../../libs/database/repository';
import { AuthPayload } from '../auth/types/auth-payload.type';
import { NotificationsService } from '../notifications/notifications.service';
import { apiSuccess } from '../../common/utils/api-response.utils';

@Injectable()
export class ReorderRequestsService {
  constructor(
    private readonly reorderRequestRepository: ReorderRequestRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly productRepository: ProductRepository,
    private readonly notificationsService: NotificationsService,
    private readonly eventsService: EventsService,
  ) {}

  async createAutomaticLowStockRequest(input: {
    companyId: string;
    warehouseId: string;
    productId: string;
    currentQuantity: number;
    safetyStock: number;
  }) {
    const existing = await this.reorderRequestRepository.findPendingByProduct(
      input.companyId,
      input.warehouseId,
      input.productId,
    );

    if (existing) {
      return existing;
    }

    const product = await this.productRepository.findByIdAndCompanyId(
      input.productId,
      input.companyId,
    );

    if (!product) return null;

    const warehouse = await this.warehouseRepository.findByIdAndCompanyId(
      input.warehouseId,
      input.companyId,
    );

    const recommendedQuantity = Math.max(product.safetyStock * 3, 50);

    const aiReason = `Current quantity (${input.currentQuantity}) is below safety stock (${product.safetyStock}). Recommended reorder quantity is ${recommendedQuantity} based on basic stock policy.`;

    const reorder = await this.reorderRequestRepository.createAndSaveItem({
      companyId: input.companyId,
      warehouseId: input.warehouseId,
      productId: input.productId,
      currentQuantity: input.currentQuantity,
      safetyStock: input.safetyStock,
      recommendedQuantity,
      aiReason,
      status: ReorderRequestStatus.PENDING,
    } as Partial<ReorderRequestEntity>);

    await this.notificationsService.createSystemNotification({
      companyId: input.companyId,
      type: NotificationType.REORDER,
      title: 'Reorder request created',
      message: `Reorder request created for ${product.name}. Recommended quantity: ${recommendedQuantity}.`,
      metadata: {
        reorderRequestId: reorder.id,
        warehouseName: warehouse?.name ?? null,
        productName: product.name,
        recommendedQuantity,
      },
    });

    await this.eventsService.publish(
      EventName.REORDER_REQUEST_CREATED,
      {
        reorderRequestId: reorder.id,
        warehouseId: input.warehouseId,
        productId: input.productId,
        recommendedQuantity,
      },
      {
        companyId: input.companyId,
      },
    );

    return reorder;
  }

  async findAll(currentUser: AuthPayload) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const items =
      await this.reorderRequestRepository.findByCompanyId(companyId);

    return apiSuccess('Reorder requests retrieved successfully', items);
  }

  async approve(currentUser: AuthPayload, id: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const item = await this.reorderRequestRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!item) {
      throw new NotFoundException('Reorder request not found');
    }

    if (item.status !== ReorderRequestStatus.PENDING) {
      throw new ConflictException(
        'Only pending reorder requests can be approved',
      );
    }

    item.status = ReorderRequestStatus.APPROVED;
    item.approvedByUserId = currentUser.sub;

    const saved = await this.reorderRequestRepository.saveItem(item);

    return apiSuccess('Reorder request approved successfully', saved);
  }

  async reject(currentUser: AuthPayload, id: string) {
    const companyId = this.getCompanyIdOrThrow(currentUser);

    const item = await this.reorderRequestRepository.findByIdAndCompanyId(
      id,
      companyId,
    );

    if (!item) {
      throw new NotFoundException('Reorder request not found');
    }

    if (item.status !== ReorderRequestStatus.PENDING) {
      throw new ConflictException(
        'Only pending reorder requests can be rejected',
      );
    }

    item.status = ReorderRequestStatus.REJECTED;
    item.approvedByUserId = currentUser.sub;

    const saved = await this.reorderRequestRepository.saveItem(item);

    return apiSuccess('Reorder request rejected successfully', saved);
  }

  private getCompanyIdOrThrow(currentUser: AuthPayload): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }
}
