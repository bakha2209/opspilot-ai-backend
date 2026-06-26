import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAiService(),
    ]);

    const result = {
      status: checks.every((item) => item.status === 'fulfilled')
        ? 'ok'
        : 'degraded',
      timestamp: new Date(),
      services: {
        database: this.format(checks[0]),
        redis: this.format(checks[1]),
        aiService: this.format(checks[2]),
      },
    };

    return result;
  }

  private async checkDatabase() {
    await this.dataSource.query('SELECT 1');
    return 'ok';
  }

  private async checkRedis() {
    const pong = await this.cacheService.ping();
    return pong === 'PONG' ? 'ok' : 'fail';
  }

  private async checkAiService() {
    const aiUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8001';

    const response = await fetch(`${aiUrl}/health`);

    if (!response.ok) {
      throw new Error('AI service unhealthy');
    }

    return 'ok';
  }

  private format(result: PromiseSettledResult<string>) {
    if (result.status === 'fulfilled') {
      return {
        status: result.value,
      };
    }

    return {
      status: 'fail',
      error:
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
    };
  }
}
