import { Test, TestingModule } from '@nestjs/testing';
import { CompanyIntegrationsService } from './company-integrations.service';

describe('CompanyIntegrationsService', () => {
  let service: CompanyIntegrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyIntegrationsService],
    }).compile();

    service = module.get<CompanyIntegrationsService>(CompanyIntegrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
