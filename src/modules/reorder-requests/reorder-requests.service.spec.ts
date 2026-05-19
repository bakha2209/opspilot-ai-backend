import { Test, TestingModule } from '@nestjs/testing';
import { ReorderRequestsService } from './reorder-requests.service';

describe('ReorderRequestsService', () => {
  let service: ReorderRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReorderRequestsService],
    }).compile();

    service = module.get<ReorderRequestsService>(ReorderRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
