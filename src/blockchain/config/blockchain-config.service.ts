import { Injectable } from '@nestjs/common';

@Injectable()
export class BlockchainConfigService {
  get maxRetry(): number {
    return this.getPositiveInteger('BLOCKCHAIN_MAX_RETRY', 3);
  }

  get retryDelay1Ms(): number {
    return this.getPositiveInteger('BLOCKCHAIN_RETRY_DELAY_1_MS', 5_000);
  }

  get retryDelay2Ms(): number {
    return this.getPositiveInteger('BLOCKCHAIN_RETRY_DELAY_2_MS', 30_000);
  }

  get retryDelay3Ms(): number {
    return this.getPositiveInteger('BLOCKCHAIN_RETRY_DELAY_3_MS', 60_000);
  }

  getRetryDelayMs(retryCount: number): number {
    if (retryCount <= 1) {
      return this.retryDelay1Ms;
    }

    if (retryCount === 2) {
      return this.retryDelay2Ms;
    }

    return this.retryDelay3Ms;
  }

  private getPositiveInteger(name: string, fallback: number): number {
    const rawValue = process.env[name];

    if (!rawValue) {
      return fallback;
    }

    const parsedValue = Number(rawValue);

    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      return fallback;
    }

    return parsedValue;
  }
}
