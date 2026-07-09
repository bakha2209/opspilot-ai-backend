import { Injectable, Logger } from '@nestjs/common';
import { AuditLogRepository } from '../../libs/database/repository';
import { FabricGatewayService } from '../fabric/fabric-gateway.service';
import { BlockchainAnchorMessage } from '../types/blokchain-anchor-message.type';
import { BlockchainStatus } from '../../modules/audit-logs/constants/blokchain-status.constant';
import { BLOCKCHAIN_AUDIT_MAX_RETRY } from '../constants/blokchain-queue.constant';

export type BlockchainAnchorPayload = BlockchainAnchorMessage & {
  retryCount?: number;
};

export type BlockchainAnchorProcessResult =
  | {
      status: 'SUCCESS';
      eventId: string;
      txId: string;
    }
  | {
      status: 'SKIP';
      reason: 'AUDIT_LOG_NOT_FOUND' | 'ALREADY_VERIFIED';
    }
  | {
      status: 'FINAL_FAILURE' | 'RETRY';
      retryCount: number;
      errorMessage: string;
    };

@Injectable()
export class BlockchainAnchorProcessor {
  private readonly logger = new Logger(BlockchainAnchorProcessor.name);

  constructor(
    private readonly fabricGatewayService: FabricGatewayService,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async process(
    payload: BlockchainAnchorPayload,
  ): Promise<BlockchainAnchorProcessResult> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id: payload.auditLogId },
    });

    if (!auditLog) {
      return {
        status: 'SKIP',
        reason: 'AUDIT_LOG_NOT_FOUND',
      };
    }

    if (auditLog.blockchainVerified) {
      return {
        status: 'SKIP',
        reason: 'ALREADY_VERIFIED',
      };
    }

    try {
      const result = await this.fabricGatewayService.createAuditAnchor({
        eventId: payload.eventId,
        companyId: payload.companyId,
        eventType: payload.eventType,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        payloadHash: payload.payloadHash,
        createdAt: payload.createdAt,
      });

      await this.auditLogRepository.update(payload.auditLogId, {
        blockchainEventId: result.result.eventId,
        blockchainTxId: result.txId,
        blockchainStatus: BlockchainStatus.VERIFIED,
        blockchainVerified: true,
        blockchainAnchorTime: new Date(),
        blockchainRetryCount: 0,
        blockchainLastError: null,
      });

      return {
        status: 'SUCCESS',
        eventId: result.result.eventId,
        txId: result.txId,
      };
    } catch (error) {
      const currentRetryCount = payload.retryCount ?? 0;
      const nextRetryCount = currentRetryCount + 1;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const isFinalFailure = nextRetryCount >= BLOCKCHAIN_AUDIT_MAX_RETRY;

      await this.auditLogRepository.update(payload.auditLogId, {
        blockchainStatus: isFinalFailure
          ? BlockchainStatus.FAILED
          : BlockchainStatus.PENDING,
        blockchainVerified: false,
        blockchainRetryCount: nextRetryCount,
        blockchainLastError: errorMessage,
      });

      return {
        status: isFinalFailure ? 'FINAL_FAILURE' : 'RETRY',
        retryCount: nextRetryCount,
        errorMessage,
      };
    }
  }

  getRetryDelayMs(retryCount: number): number {
    if (retryCount === 1) {
      return process.env.BLOCKCHAIN_RETRY_DELAY_1
        ? parseInt(process.env.BLOCKCHAIN_RETRY_DELAY_1, 10)
        : 5_000;
    }

    if (retryCount === 2) {
      return process.env.BLOCKCHAIN_RETRY_DELAY_2
        ? parseInt(process.env.BLOCKCHAIN_RETRY_DELAY_2, 10)
        : 30_000;
    }

    if (retryCount === 3) {
      return process.env.BLOCKCHAIN_RETRY_DELAY_3
        ? parseInt(process.env.BLOCKCHAIN_RETRY_DELAY_3, 10)
        : 60_000;
    }

    return 60_000;
  }
}
