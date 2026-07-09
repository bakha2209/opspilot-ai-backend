import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAuditAnchorDto } from '../dto/create-audit-anchor.dto';
import { FabricGatewayService } from '../fabric/fabric-gateway.service';
import { AuditLogRepository } from '../../libs/database/repository';
import { BlockchainPublisherService } from './blkchain-publisher.service';
import { createSha256Hash } from '../../libs/core/utils/hash.util';
import { BlockchainStatus } from '../../modules/audit-logs/constants/blokchain-status.constant';

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

  async retryAuditAnchor(auditLogId: string): Promise<RetryAuditAnchorResult> {
    const audit = await this.auditLogRepository.findOne({
      where: { id: auditLogId },
    });

    if (!audit) {
      throw new NotFoundException('Audit log not found');
    }

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

  async retryAllFailedAuditAnchors() {
    const failedLogs = await this.auditLogRepository.findFailedBlockchainLogs();

    const results: RetryAuditAnchorResult[] = [];

    for (const audit of failedLogs) {
      results.push(await this.retryAuditAnchor(audit.id));
    }

    return {
      total: results.length,
      items: results,
    };
  }
  async getStatistics() {
    return this.auditLogRepository.getBlockchainStatistics();
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
