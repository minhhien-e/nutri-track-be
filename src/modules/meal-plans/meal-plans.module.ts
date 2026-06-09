import { Module } from '@nestjs/common';
import { DiaryModule } from '../diary/diary.module';
import { FoodsModule } from '../foods/foods.module';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';

@Module({
  imports: [DiaryModule, FoodsModule],
  controllers: [MealPlansController],
  providers: [MealPlansService],
  exports: [MealPlansService],
})
export class MealPlansModule {}
