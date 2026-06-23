import { Module } from '@nestjs/common';
import { DiaryModule } from '@/modules/diary/diary.module';
import { FoodsModule } from '@/modules/foods/foods.module';
import { MealPlansController } from '@/modules/meal-plans/meal-plans.controller';
import { MealPlansService } from '@/modules/meal-plans/meal-plans.service';

@Module({
  imports: [DiaryModule, FoodsModule],
  controllers: [MealPlansController],
  providers: [MealPlansService],
  exports: [MealPlansService],
})
export class MealPlansModule {}
