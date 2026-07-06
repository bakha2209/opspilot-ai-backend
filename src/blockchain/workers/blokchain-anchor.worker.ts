import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { connect, Channel, Connection } from 'amqplib';
import { AuditLogRepository } from '../../libs/database/repository';
import { FabricGatewayService } from '../fabric/fabric-gateway.service';
import { BLOCKCHAIN_AUDIT_ANCHOR_QUEUE } from '../constants/blokchain-queue.constant';
import { BlockchainStatus } from '../../modules/audit-logs/constants/blokchain-status.constant';


@Injectable()
export class BlockchainAnchorWorker implements OnModuleInit {
  private readonly logger = new Logger(BlockchainAnchorWorker.name);

  private connection: Connection;
  private channel: Channel;

  constructor(
    private readonly fabricGatewayService: FabricGatewayService,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async onModuleInit() {
    await this.startConsumer();
  }

  private async startConsumer() {
    const rabbitUrl =
      process.env.RABBITMQ_URL ?? 'amqp://guest:guest@rabbitmq:5672';

    this.connection = await connect(rabbitUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(BLOCKCHAIN_AUDIT_ANCHOR_QUEUE, {
      durable: true,
    });

    await this.channel.consume(
      BLOCKCHAIN_AUDIT_ANCHOR_QUEUE,
      async (message) => {
        if (!message) {
          return;
        }

        const payload = JSON.parse(message.content.toString());

        try {
          this.logger.log(`Anchoring ${payload.eventId}`);

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
          });

          this.channel.ack(message);
        } catch (error) {
          this.logger.error(error);

         const currentRetryCount = payload.retryCount ?? 0;
         const nextRetryCount = currentRetryCount + 1;

         await this.auditLogRepository.update(payload.auditLogId, {
           blockchainStatus:
             nextRetryCount >= 3
               ? BlockchainStatus.FAILED
               : BlockchainStatus.PENDING,
           blockchainVerified: false,
           blockchainRetryCount: nextRetryCount,
           blockchainLastError:
             error instanceof Error ? error.message : String(error),
         });

          if (nextRetryCount >= 3) {
            this.channel.ack(message);
            this.logger.error(
              `Blockchain anchor failed permanently: ${payload.eventId}`,
            );
            return;
          }

          this.channel.sendToQueue(
            BLOCKCHAIN_AUDIT_ANCHOR_QUEUE,
            Buffer.from(
              JSON.stringify({
                ...payload,
                retryCount: nextRetryCount,
              }),
            ),
            { persistent: true },
          );

          this.channel.ack(message);
        }
      },
    );
  }
}
