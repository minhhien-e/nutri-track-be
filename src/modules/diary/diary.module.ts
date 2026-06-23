import { Module } from '@nestjs/common';
import { FoodsModule } from '@/modules/foods/foods.module';
import { DiaryController } from '@/modules/diary/diary.controller';
import { DiaryRepository } from '@/modules/diary/diary.repository';
import { DiaryService } from '@/modules/diary/diary.service';
import { DiaryTotalsService } from '@/modules/diary/diary-totals.service';

@Module({
  imports: [FoodsModule],
  controllers: [DiaryController],
  providers: [DiaryService, DiaryRepository, DiaryTotalsService],
  exports: [DiaryService, DiaryTotalsService],
})
export class DiaryModule {}
