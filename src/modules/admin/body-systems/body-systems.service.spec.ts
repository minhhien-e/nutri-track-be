import { Test, TestingModule } from '@nestjs/testing';
import { BodySystemsService } from '@/modules/admin/body-systems/body-systems.service';

describe('BodySystemsService', () => {
  let service: BodySystemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BodySystemsService],
    }).compile();

    service = module.get<BodySystemsService>(BodySystemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
