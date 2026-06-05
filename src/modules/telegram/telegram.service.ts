import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return this.configService.get<string>('TELEGRAM_ENABLED') === 'true';
  }

  async sendMessage(text: string, chatId?: string): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.log(`Telegram disabled. Message skipped: ${text}`);
      return;
    }

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const targetChatId =
      chatId || this.configService.get<string>('TELEGRAM_DEFAULT_CHAT_ID');

    if (!botToken || !targetChatId) {
      this.logger.warn('Telegram config missing. Message skipped.');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Telegram send failed: ${errorText}`);
      return;
    }

    this.logger.log('Telegram message sent successfully');
  }
}
