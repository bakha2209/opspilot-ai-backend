import { Injectable, Logger } from '@nestjs/common';
import { Channel, connect, Connection } from 'amqplib';
import { BlockchainAnchorMessage } from '../types/blokchain-anchor-message.type';
import { BLOCKCHAIN_AUDIT_ANCHOR_QUEUE } from '../constants/blokchain-queue.constant';

@Injectable()
export class BlockchainPublisherService {
  private readonly logger = new Logger(BlockchainPublisherService.name);

  private connection: Connection;
  private channel: Channel;

  async publishAuditAnchor(message: BlockchainAnchorMessage) {
    if (!this.channel) {
      await this.connect();
    }

    await this.channel.assertQueue(BLOCKCHAIN_AUDIT_ANCHOR_QUEUE, {
      durable: true,
    });

    this.channel.sendToQueue(
      BLOCKCHAIN_AUDIT_ANCHOR_QUEUE,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      },
    );

    this.logger.log(`Blockchain anchor queued: ${message.eventId}`);
  }

  private async connect() {
    const rabbitUrl =
      process.env.RABBITMQ_URL ?? 'amqp://guest:guest@rabbitmq:5672';

    this.connection = await connect(rabbitUrl);
    this.channel = await this.connection.createChannel();
  }
}
