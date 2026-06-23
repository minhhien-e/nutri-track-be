import { Module } from '@nestjs/common';
import { DiaryTotalsService } from '@/modules/diary/diary-totals.service';
import { AnalyticsController } from '@/modules/analytics/analytics.controller';
import { AnalyticsService } from '@/modules/analytics/analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DiaryTotalsService],
})
export class AnalyticsModule {}
