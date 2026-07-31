import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    })
      .useMocker(() => ({}))
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status', () => {
      expect(appController.health()).toMatchObject({
        success: true,
        message: 'Service is healthy',
        data: {
          service: 'OpsPilot AI Backend',
          timestamp: expect.any(String),
        },
        error: null,
      });
    });
  });
});
