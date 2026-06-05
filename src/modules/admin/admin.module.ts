import { Module } from '@nestjs/common';
import { FoodsModule } from '../foods/foods.module';
import { AdminFoodsController } from './foods/admin-foods.controller';
import { AdminFoodsService } from './foods/admin-foods.service';

@Module({
  imports: [FoodsModule],
  controllers: [AdminFoodsController],
  providers: [AdminFoodsService],
})
export class AdminModule {}
