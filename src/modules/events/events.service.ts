import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';
import { EventNameType } from './constants/event-name.constant';
import { DomainEvent } from './types/domain-event.type';

@Injectable()
export class EventsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);

  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private exchangeName: string;

  constructor(private readonly configService: ConfigService) {
    this.exchangeName =
      this.configService.get<string>('RABBITMQ_EXCHANGE') || 'opspilot.events';
  }

  async onApplicationBootstrap() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  async publish<TPayload>(
    eventName: EventNameType,
    payload: TPayload,
    options?: {
      companyId?: string | null;
      actorId?: string | null;
    },
  ) {
    if (!this.channel) {
      this.logger.warn(
        `RabbitMQ channel not ready. Event skipped: ${eventName}`,
      );
      return;
    }

    const event: DomainEvent<TPayload> = {
      eventId: randomUUID(),
      eventName,
      occurredAt: new Date().toISOString(),
      companyId: options?.companyId ?? null,
      actorId: options?.actorId ?? null,
      payload,
    };

    const routingKey = eventName;

    const success = this.channel.publish(
      this.exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );

    if (!success) {
      this.logger.warn(`RabbitMQ publish returned false: ${eventName}`);
    }

    this.logger.log(`Published event: ${eventName}`);
  }

  private async connect() {
    const url = this.configService.get<string>('RABBITMQ_URL');

    if (!url) {
      this.logger.warn('RabbitMQ URL is missing. Event publisher disabled.');
      return;
    }

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      this.connection.on('error', (error) => {
        this.logger.error(`RabbitMQ connection error: ${error.message}`);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
      });

      this.logger.log(`RabbitMQ connected. Exchange=${this.exchangeName}`);
    } catch (error: any) {
      this.logger.error(`RabbitMQ connection failed: ${error.message}`);
      this.connection = null;
      this.channel = null;
    }
  }

  private async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      this.logger.log('RabbitMQ connection closed gracefully');
    } catch (error: any) {
      this.logger.warn(`RabbitMQ close failed: ${error.message}`);
    }
  }
}
