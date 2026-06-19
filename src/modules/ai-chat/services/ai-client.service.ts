import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { Readable } from 'node:stream';

@Injectable()
export class AiClientService {
  constructor(private readonly configService: ConfigService) {}

  async chat(payload: any) {
    const baseUrl = this.configService.get<string>('AI_SERVICE_URL');

    const response = await axios.post(
      `${baseUrl}/api/v1/copilot/chat`,
      payload,
    );

    return response.data;
  }

  async chatStream(payload: any): Promise<Readable> {
  const baseUrl = this.configService.get<string>('AI_SERVICE_URL');

  const response = await axios.post(
    `${baseUrl}/api/v1/copilot/chat/stream`,
    payload,
    {
      responseType: 'stream',
    },
  );

  return response.data;
}
}
