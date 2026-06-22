import { Module } from '@nestjs/common';
import { DiaryTotalsService } from '../diary/diary-totals.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DiaryTotalsService],
})
export class AnalyticsModule {}
