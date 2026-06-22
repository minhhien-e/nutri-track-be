import { Module } from '@nestjs/common';
import { FoodsModule } from '../foods/foods.module';
import { DiaryController } from './diary.controller';
import { DiaryRepository } from './diary.repository';
import { DiaryService } from './diary.service';
import { DiaryTotalsService } from './diary-totals.service';

@Module({
  imports: [FoodsModule],
  controllers: [DiaryController],
  providers: [DiaryService, DiaryRepository, DiaryTotalsService],
  exports: [DiaryService, DiaryTotalsService],
})
export class DiaryModule {}
