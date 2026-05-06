import { Injectable } from '@nestjs/common';
import { apiSuccess } from './common/utils/api-response.utils';


@Injectable()
export class AppService {
  health() {
    return apiSuccess('Service is healthy', {
      service: 'OpsPilot AI Backend',
      timestamp: new Date().toISOString(),
    });
  }
}