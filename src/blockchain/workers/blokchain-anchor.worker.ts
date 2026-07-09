import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Channel, connect, Connection, ConsumeMessage } from 'amqplib';
import { BlockchainAnchorProcessor } from '../services/blockchain-anchor.processor';
import { BLOCKCHAIN_AUDIT_ANCHOR_QUEUE, BLOCKCHAIN_AUDIT_DEAD_QUEUE } from '../constants/blokchain-queue.constant';
import { BlockchainAnchorMessage } from '../types/blokchain-anchor-message.type';

@Injectable()
export class BlockchainAnchorWorker implements OnModuleInit {
  private readonly logger = new Logger(BlockchainAnchorWorker.name);

  private connection: Connection;
  private channel: Channel;

  constructor(private readonly processor: BlockchainAnchorProcessor) {}

  async onModuleInit() {
    await this.startConsumer();
  }

  private async startConsumer() {
    const rabbitUrl =
      process.env.RABBITMQ_URL ?? 'amqp://guest:guest@rabbitmq:5672';

    this.connection = await connect(rabbitUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.prefetch(1);

    await this.channel.assertQueue(BLOCKCHAIN_AUDIT_ANCHOR_QUEUE, {
      durable: true,
    });

    await this.channel.assertQueue(BLOCKCHAIN_AUDIT_DEAD_QUEUE, {
      durable: true,
    });

    await this.channel.consume(BLOCKCHAIN_AUDIT_ANCHOR_QUEUE, async (message) =>
      this.handleMessage(message),
    );

    this.logger.log('Blockchain anchor worker started');
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }

    const payload = JSON.parse(
      message.content.toString(),
    ) as BlockchainAnchorMessage & { retryCount?: number };

    const result = await this.processor.process(payload);

    if (result.status === 'SUCCESS') {
      this.logger.log(
        `Blockchain anchor success: ${result.eventId}, tx=${result.txId}`,
      );

      this.channel.ack(message);
      return;
    }

    if (result.status === 'SKIP') {
      this.logger.warn(
        `Blockchain anchor skipped: ${payload.eventId}, reason=${result.reason}`,
      );

      this.channel.ack(message);
      return;
    }

    if (result.status === 'FINAL_FAILURE') {
      this.channel.sendToQueue(
        BLOCKCHAIN_AUDIT_DEAD_QUEUE,
        Buffer.from(
          JSON.stringify({
            ...payload,
            retryCount: result.retryCount,
            failedAt: new Date().toISOString(),
            error: result.errorMessage,
          }),
        ),
        { persistent: true },
      );

      this.logger.error(`Blockchain anchor moved to DLQ: ${payload.eventId}`);

      this.channel.ack(message);
      return;
    }

    if (result.status === 'RETRY') {
      setTimeout(() => {
        this.channel.sendToQueue(
          BLOCKCHAIN_AUDIT_ANCHOR_QUEUE,
          Buffer.from(
            JSON.stringify({
              ...payload,
              retryCount: result.retryCount,
            }),
          ),
          { persistent: true },
        );

        this.logger.warn(
          `Blockchain anchor retry scheduled: ${payload.eventId}, retry=${result.retryCount}`,
        );
      }, this.processor.getRetryDelayMs(result.retryCount));

      this.channel.ack(message);
      return;
    }

    this.channel.ack(message);
  }
}
