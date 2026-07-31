import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementsController } from './stock-movements.controller';

describe('StockMovementsController', () => {
  let controller: StockMovementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockMovementsController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<StockMovementsController>(StockMovementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
