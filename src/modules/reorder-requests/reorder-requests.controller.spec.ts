import { Test, TestingModule } from '@nestjs/testing';
import { ReorderRequestsController } from './reorder-requests.controller';

describe('ReorderRequestsController', () => {
  let controller: ReorderRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReorderRequestsController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<ReorderRequestsController>(ReorderRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
