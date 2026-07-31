import { Test, TestingModule } from '@nestjs/testing';
import { AiCopilotService } from './ai-copilot.service';

describe('AiCopilotService', () => {
  let service: AiCopilotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiCopilotService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get<AiCopilotService>(AiCopilotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
