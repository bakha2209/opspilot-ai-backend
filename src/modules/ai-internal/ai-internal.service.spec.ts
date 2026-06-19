import { Test, TestingModule } from '@nestjs/testing';
import { AiInternalService } from './ai-internal.service';

describe('AiInternalService', () => {
  let service: AiInternalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiInternalService],
    }).compile();

    service = module.get<AiInternalService>(AiInternalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
