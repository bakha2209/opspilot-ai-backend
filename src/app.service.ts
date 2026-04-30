import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      status: 'ok',
      service: 'OpsPilot AI Backend',
      timestamp: new Date().toISOString(),
    };
  }
}