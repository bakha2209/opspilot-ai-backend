import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuditAnchorDto } from '../dto/create-audit-anchor.dto';
import { FabricGatewayService } from '../fabric/fabric-gateway.service';
import { AuditLogRepository } from '../../libs/database/repository';
import { BlockchainPublisherService } from './blkchain-publisher.service';
import {
  createLegacySha256Hash,
  createSha256Hash,
} from '../../libs/core/utils/hash.util';
import { BlockchainStatus } from '../../modules/audit-logs/constants/blokchain-status.constant';
import {
  InventoryRepository,
  ProductRepository,
  ReorderRequestRepository,
  WarehouseRepository,
} from '../../libs/database/repository';
import { UserRole } from '../../common/enums/user-role.enum';
import type { AuthPayload } from '../../modules/auth/types/auth-payload.type';

type RetryAuditAnchorResult = {
  auditLogId: string;
  eventId: string;
  status: 'REQUEUED';
};

@Injectable()
export class BlockchainService {
  constructor(
    private readonly fabricGatewayService: FabricGatewayService,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly blockchainPublisherService: BlockchainPublisherService,
    private readonly inventoryRepository: InventoryRepository,
    private readonly productRepository: ProductRepository,
    private readonly warehouseRepository: WarehouseRepository,
    private readonly reorderRequestRepository: ReorderRequestRepository,
  ) {}

  async createAuditAnchor(dto: CreateAuditAnchorDto) {
    return this.fabricGatewayService.createAuditAnchor(dto);
  }

  async getAuditAnchor(eventId: string) {
    return this.getAnchorOrThrowNotFound(eventId);
  }

  async verifyAuditAnchor(eventId: string, payloadHash: string) {
    return this.fabricGatewayService.verifyAuditAnchor(eventId, payloadHash);
  }

  async getBlockchainEvent(eventId: string) {
    return this.getAnchorOrThrowNotFound(eventId);
  }

  async verifyBlockchainEvent(eventId: string, payloadHash: string) {
    return this.fabricGatewayService.verifyAuditAnchor(eventId, payloadHash);
  }

  async getAuditEventDetails(
    currentUser: AuthPayload,
    auditLogId: string,
  ) {
    const audit = await this.getAuthorizedAuditLog(currentUser, auditLogId);
    const auditPayload = this.buildAuditPayload(audit);
    const currentHash = createSha256Hash(auditPayload);
    const network = this.fabricGatewayService.getNetworkMetadata();
    const resource = await this.getResourceContext(audit);

    let anchor: Record<string, unknown> | null = null;
    let verification: {
      verified: boolean;
      reason?: string;
      storedHash?: string;
      requestHash?: string;
    } | null = null;
    let ledgerError: string | null = null;
    let hashVersion: 'v2-recursive' | 'v1-legacy' = 'v2-recursive';
    let effectiveCurrentHash = currentHash;

    if (audit.blockchainEventId) {
      try {
        anchor = await this.fabricGatewayService.getAuditAnchor(
          audit.blockchainEventId,
        );
        const primaryVerification =
          await this.fabricGatewayService.verifyAuditAnchor(
          audit.blockchainEventId,
          currentHash,
        );
        verification = primaryVerification;
        if (!primaryVerification.verified) {
          const legacyHash = createLegacySha256Hash(auditPayload);
          const legacyVerification =
            await this.fabricGatewayService.verifyAuditAnchor(
              audit.blockchainEventId,
              legacyHash,
            );

          if (legacyVerification.verified) {
            verification = legacyVerification;
            effectiveCurrentHash = legacyHash;
            hashVersion = 'v1-legacy';
          }
        }
      } catch (error) {
        ledgerError = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      audit: {
        id: audit.id,
        action: audit.action,
        resourceType: audit.resourceType,
        resourceId: audit.resourceId ?? null,
        beforeData: audit.beforeData ?? null,
        afterData: audit.afterData ?? null,
        createdAt: audit.createdAt,
        actor: audit.user
          ? {
              id: audit.user.id,
              name: audit.user.name,
              role: audit.user.role,
            }
          : null,
        company: audit.company
          ? {
              id: audit.company.id,
              name: audit.company.name,
            }
          : null,
      },
      resource,
      blockchain: {
        status: audit.blockchainStatus ?? BlockchainStatus.PENDING,
        verified: verification?.verified ?? false,
        eventId: audit.blockchainEventId ?? null,
        transactionId: audit.blockchainTxId ?? null,
        anchorTime: audit.blockchainAnchorTime ?? null,
        retryCount: audit.blockchainRetryCount,
        lastError: audit.blockchainLastError ?? null,
        currentHash: effectiveCurrentHash,
        storedHash: verification?.storedHash ?? null,
        hashesMatch: verification?.verified ?? false,
        hashVersion,
        fullPayloadCoverage: hashVersion === 'v2-recursive',
        channel: network.channel,
        chaincode: network.chaincode,
        anchor,
        ledgerError,
      },
    };
  }

  async verifyAuditEvent(currentUser: AuthPayload, auditLogId: string) {
    const audit = await this.getAuthorizedAuditLog(currentUser, auditLogId);

    if (!audit.blockchainEventId) {
      throw new NotFoundException('Audit log has no blockchain event');
    }

    const auditPayload = this.buildAuditPayload(audit);
    let currentHash = createSha256Hash(auditPayload);
    let hashVersion: 'v2-recursive' | 'v1-legacy' = 'v2-recursive';
    let result = await this.fabricGatewayService.verifyAuditAnchor(
      audit.blockchainEventId,
      currentHash,
    );

    if (!result.verified) {
      const legacyHash = createLegacySha256Hash(auditPayload);
      const legacyResult = await this.fabricGatewayService.verifyAuditAnchor(
        audit.blockchainEventId,
        legacyHash,
      );

      if (legacyResult.verified) {
        result = legacyResult;
        currentHash = legacyHash;
        hashVersion = 'v1-legacy';
      }
    }

    return {
      eventId: audit.blockchainEventId,
      currentHash,
      hashVersion,
      fullPayloadCoverage: hashVersion === 'v2-recursive',
      ...result,
    };
  }

  private async getAuthorizedAuditLog(
    currentUser: AuthPayload,
    auditLogId: string,
  ) {
    const audit = await this.auditLogRepository.findOne({
      where: { id: auditLogId },
      relations: { company: true, user: true },
    });

    if (
      !audit ||
      (currentUser.role !== UserRole.SUPER_ADMIN &&
        audit.companyId !== currentUser.companyId)
    ) {
      throw new NotFoundException('Blockchain audit event not found');
    }

    return audit;
  }

  private buildAuditPayload(audit: {
    companyId?: string | null;
    userId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    beforeData?: Record<string, unknown> | null;
    afterData?: Record<string, unknown> | null;
  }) {
    return {
      companyId: audit.companyId ?? null,
      userId: audit.userId ?? null,
      action: audit.action,
      resourceType: audit.resourceType,
      resourceId: audit.resourceId ?? null,
      beforeData: audit.beforeData ?? null,
      afterData: audit.afterData ?? null,
    };
  }

  private async getResourceContext(audit: {
    companyId?: string | null;
    resourceId?: string | null;
    resourceType: string;
  }) {
    if (!audit.companyId || !audit.resourceId) {
      return null;
    }

    if (audit.resourceType === 'Inventory') {
      const item = await this.inventoryRepository.findByIdAndCompanyId(
        audit.resourceId,
        audit.companyId,
      );

      return item
        ? {
            type: 'Inventory',
            id: item.id,
            quantity: item.quantity,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              unit: item.product.unit,
            },
            warehouse: {
              id: item.warehouse.id,
              name: item.warehouse.name,
              code: item.warehouse.code,
            },
          }
        : null;
    }

    if (audit.resourceType === 'ReorderRequest') {
      const item = await this.reorderRequestRepository.findByIdAndCompanyId(
        audit.resourceId,
        audit.companyId,
      );

      return item
        ? {
            type: 'ReorderRequest',
            id: item.id,
            status: item.status,
            currentQuantity: item.currentQuantity,
            safetyStock: item.safetyStock,
            recommendedQuantity: item.recommendedQuantity,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              unit: item.product.unit,
            },
            warehouse: {
              id: item.warehouse.id,
              name: item.warehouse.name,
              code: item.warehouse.code,
            },
          }
        : null;
    }

    if (audit.resourceType === 'Product') {
      const item = await this.productRepository.findByIdAndCompanyId(
        audit.resourceId,
        audit.companyId,
      );

      return item
        ? {
            type: 'Product',
            id: item.id,
            name: item.name,
            sku: item.sku,
            unit: item.unit,
            status: item.status,
          }
        : null;
    }

    if (audit.resourceType === 'Warehouse') {
      const item = await this.warehouseRepository.findByIdAndCompanyId(
        audit.resourceId,
        audit.companyId,
      );

      return item
        ? {
            type: 'Warehouse',
            id: item.id,
            name: item.name,
            code: item.code,
            location: item.location ?? null,
            status: item.status,
          }
        : null;
    }

    return null;
  }

  private async getAnchorOrThrowNotFound(eventId: string) {
    try {
      return await this.fabricGatewayService.getAuditAnchor(eventId);
    } catch (error) {
      if (this.isAuditAnchorNotFoundError(error)) {
        throw new NotFoundException(`Blockchain event not found: ${eventId}`);
      }

      throw error;
    }
  }

  private isAuditAnchorNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error && error.message.includes('Audit anchor not found')
    );
  }

  async retryAuditAnchor(
    currentUser: AuthPayload,
    auditLogId: string,
  ): Promise<RetryAuditAnchorResult> {
    const audit = await this.getAuthorizedAuditLog(currentUser, auditLogId);

    const payload = {
      companyId: audit.companyId,
      userId: audit.userId,
      action: audit.action,
      resourceType: audit.resourceType,
      resourceId: audit.resourceId,
      beforeData: audit.beforeData,
      afterData: audit.afterData,
    };

    const payloadHash = createSha256Hash(payload);

    const eventId = audit.blockchainEventId ?? `audit-${audit.id}`;

    await this.auditLogRepository.update(audit.id, {
      blockchainEventId: eventId,
      blockchainStatus: BlockchainStatus.PENDING,
      blockchainVerified: false,
      blockchainRetryCount: 0,
      blockchainLastError: null,
    });

    await this.blockchainPublisherService.publishAuditAnchor({
      auditLogId: audit.id,
      eventId,
      companyId: audit.companyId ?? '00000000-0000-0000-0000-000000000000',
      eventType: audit.action,
      resourceType: audit.resourceType,
      resourceId: audit.resourceId ?? audit.id,
      payloadHash,
      createdAt: audit.createdAt.toISOString(),
    });

    return {
      auditLogId: audit.id,
      eventId,
      status: 'REQUEUED',
    };
  }

  async retryAllFailedAuditAnchors(currentUser: AuthPayload) {
    const companyId = this.getCompanyScope(currentUser);
    const failedLogs =
      await this.auditLogRepository.findFailedBlockchainLogs(companyId);

    const results: RetryAuditAnchorResult[] = [];

    for (const audit of failedLogs) {
      results.push(await this.retryAuditAnchor(currentUser, audit.id));
    }

    return {
      total: results.length,
      items: results,
    };
  }
  async getStatistics(currentUser: AuthPayload) {
    const companyId = this.getCompanyScope(currentUser);

    return this.auditLogRepository.getBlockchainStatistics(companyId);
  }

  private getCompanyScope(currentUser: AuthPayload): string | undefined {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return undefined;
    }

    if (!currentUser.companyId) {
      throw new ForbiddenException('Company context is missing');
    }

    return currentUser.companyId;
  }

  async health() {
    try {
      const fabric = await this.fabricGatewayService.healthCheck();

      return {
        fabric,
        rabbitmq: 'UP',
        worker: 'UP',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        fabric: {
          status: 'DOWN',
          error: error instanceof Error ? error.message : String(error),
        },
        rabbitmq: 'UNKNOWN',
        worker: 'UNKNOWN',
        timestamp: new Date(),
      };
    }
  }
}
