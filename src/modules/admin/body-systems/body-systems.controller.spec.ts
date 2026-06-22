import { Test, TestingModule } from '@nestjs/testing';
import { BodySystemsController } from './body-systems.controller';

describe('BodySystemsController', () => {
  let controller: BodySystemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BodySystemsController],
    }).compile();

    controller = module.get<BodySystemsController>(BodySystemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
