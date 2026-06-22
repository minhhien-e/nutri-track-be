import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsRepository } from './foods.repository';
import { FoodsService } from './foods.service';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService, FoodsRepository],
  exports: [FoodsService, FoodsRepository],
})
export class FoodsModule {}
