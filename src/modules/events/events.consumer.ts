import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class EventsConsumer implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(EventsConsumer.name);

  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private exchangeName: string;
  private queueName = 'opspilot.backend.events';

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

  private async connect() {
    const url = this.configService.get<string>('RABBITMQ_URL');

    if (!url) {
      this.logger.warn('RabbitMQ URL is missing. Event consumer disabled.');
      return;
    }

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });

      await this.channel.bindQueue(this.queueName, this.exchangeName, '#');

      await this.channel.consume(
        this.queueName,
        (message) => {
          if (!message) return;

          try {
            const content = JSON.parse(message.content.toString());
            this.logger.log(
              `Consumed event: ${content.eventName} eventId=${content.eventId}`,
            );

            this.channel?.ack(message);
          } catch (error: any) {
            this.logger.error(`Failed to consume event: ${error.message}`);
            this.channel?.nack(message, false, false);
          }
        },
        {
          noAck: false,
        },
      );

      this.logger.log(`RabbitMQ consumer started. Queue=${this.queueName}`);
    } catch (error: any) {
      this.logger.error(
        `RabbitMQ consumer connection failed: ${error.message}`,
      );
      this.connection = null;
      this.channel = null;
    }
  }

  private async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error: any) {
      this.logger.warn(`RabbitMQ consumer close failed: ${error.message}`);
    }
  }
}
