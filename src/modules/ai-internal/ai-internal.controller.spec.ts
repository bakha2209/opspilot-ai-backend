import { Test, TestingModule } from '@nestjs/testing';
import { AiInternalController } from './ai-internal.controller';

describe('AiInternalController', () => {
  let controller: AiInternalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiInternalController],
    }).compile();

    controller = module.get<AiInternalController>(AiInternalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
