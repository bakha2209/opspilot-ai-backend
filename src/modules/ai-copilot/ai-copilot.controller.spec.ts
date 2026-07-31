import { Test, TestingModule } from '@nestjs/testing';
import { AiCopilotController } from './ai-copilot.controller';

describe('AiCopilotController', () => {
  let controller: AiCopilotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiCopilotController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<AiCopilotController>(AiCopilotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
