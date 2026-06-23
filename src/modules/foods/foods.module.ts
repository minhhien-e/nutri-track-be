import { Module } from '@nestjs/common';
import { FoodsController } from '@/modules/foods/foods.controller';
import { FoodsRepository } from '@/modules/foods/foods.repository';
import { FoodsService } from '@/modules/foods/foods.service';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService, FoodsRepository],
  exports: [FoodsService, FoodsRepository],
})
export class FoodsModule {}
