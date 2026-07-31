import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';

@Injectable()
export class AiClientService {
  constructor(private readonly configService: ConfigService) {}

  async chat(payload: any) {
    const baseUrl = this.configService.get<string>('AI_SERVICE_URL');

    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/copilot/chat`,
        payload,
        { timeout: 130_000 },
      );

      return response.data;
    } catch (error) {
      this.rethrowAiError(error);
    }
  }

  async chatStream(payload: any): Promise<Readable> {
    const baseUrl = this.configService.get<string>('AI_SERVICE_URL');

    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/copilot/chat/stream`,
        payload,
        {
          responseType: 'stream',
          timeout: 130_000,
        },
      );

      return response.data;
    } catch (error) {
      this.rethrowAiError(error);
    }
  }

  private rethrowAiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
        throw new GatewayTimeoutException(
          'The AI model took too long to respond. Please try again.',
        );
      }

      throw new BadGatewayException(
        error.response?.data?.detail ||
          'The AI service is temporarily unavailable.',
      );
    }

    throw error;
  }
}
