import { Test, TestingModule } from '@nestjs/testing';
import { CompanyIntegrationsController } from './company-integrations.controller';

describe('CompanyIntegrationsController', () => {
  let controller: CompanyIntegrationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyIntegrationsController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<CompanyIntegrationsController>(CompanyIntegrationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
