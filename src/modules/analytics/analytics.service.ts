import { Injectable } from '@nestjs/common';
import { DailyRecord, MealEntry, NutritionTarget, UserProfile } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DiaryTotalsService } from '../diary/diary-totals.service';

const DAY_MS = 86_400_000;
const KCAL_PER_KG = 7700;
const exerciseCompensationRatio = {
  loseWeight: 0.4,
  maintainWeight: 0.7,
  gainWeight: 0.9,
} as const;

type RecordWithEntries = DailyRecord & { mealEntries: MealEntry[] };
type TrendDirection = 'up' | 'down' | 'flat';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly diaryTotalsService: DiaryTotalsService,
  ) {}

  async getDaily(userId: string, dateKey: string) {
    const context = await this.loadContext(userId);
    const records = await this.recordsForKeys(userId, this.comparisonDateKeys(dateKey));
    const record = records.get(dateKey) ?? null;
    const previous = records.get(addDaysKey(dateKey, -1)) ?? null;
    const sevenDayRecords = this.previousDateKeys(dateKey, 7)
      .map((key) => records.get(key))
      .filter((item): item is RecordWithEntries => item != null);
    const summary = this.buildDaySummary(dateKey, record, context, sevenDayRecords);

    return {
      ...summary,
      comparisons: {
        previousDay: previous
          ? this.compactDay(previous.dateKey, previous, context)
          : this.emptyCompactDay(addDaysKey(dateKey, -1), context),
        sevenDayAverage: this.averageCompactDays(sevenDayRecords, context),
      },
    };
  }

  async getRange(userId: string, from: string, to: string) {
    const context = await this.loadContext(userId);
    const dateKeys = dateKeysBetween(from, to);
    const records = await this.recordsForKeys(userId, dateKeys);
    const series = dateKeys.map((dateKey) =>
      this.compactDay(dateKey, records.get(dateKey) ?? null, context),
    );

    return {
      from,
      to,
      series,
      summary: {
        calories: summarize(series.map((item) => item.calories)),
        proteinG: summarize(series.map((item) => item.proteinG)),
        carbsG: summarize(series.map((item) => item.carbsG)),
        totalFatG: summarize(series.map((item) => item.totalFatG)),
        fiberG: summarize(series.map((item) => item.fiberG)),
        waterMl: summarize(series.map((item) => item.waterMl)),
        deficitOrSurplusKcal: summarize(
          series.map((item) => item.deficitOrSurplusKcal),
        ),
      },
    };
  }

  private async loadContext(userId: string) {
    const [profile, target] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);
    return { profile, target };
  }

  private async recordsForKeys(userId: string, dateKeys: string[]) {
    const records = await this.prisma.dailyRecord.findMany({
      where: { userId, dateKey: { in: dateKeys } },
      include: { mealEntries: true },
      orderBy: { dateKey: 'asc' },
    });
    return new Map(records.map((record) => [record.dateKey, record]));
  }

  private buildDaySummary(
    dateKey: string,
    record: RecordWithEntries | null,
    context: { profile: UserProfile | null; target: NutritionTarget | null },
    sevenDayRecords: RecordWithEntries[],
  ) {
    const compact = this.compactDay(dateKey, record, context);
    const target = context.target;
    const hydration = hydrationFor(compact.fiberG, compact.waterMl, target);
    const scores = this.scores(compact, hydration, target, sevenDayRecords);
    const insights = insightsFor(compact, hydration, scores, target);

    return {
      dateKey,
      nutrition: {
        calories: compact.calories,
        proteinG: compact.proteinG,
        carbsG: compact.carbsG,
        totalFatG: compact.totalFatG,
        fiberG: compact.fiberG,
        waterMl: compact.waterMl,
      },
      hydration,
      energy: {
        caloriesIn: compact.calories,
        exerciseCalories: compact.exerciseCalories,
        dailyBurnKcal: compact.dailyBurnKcal,
        deficitOrSurplusKcal: compact.deficitOrSurplusKcal,
        plannedDeficitOrSurplusKcal: compact.plannedDeficitOrSurplusKcal,
        recommendedIntakeKcal: compact.recommendedIntakeKcal,
        exerciseCompensationKcal: compact.exerciseCompensationKcal,
        planGapKcal: compact.planGapKcal,
        estimatedFatKg: Math.abs(compact.deficitOrSurplusKcal) / KCAL_PER_KG,
      },
      scores,
      insights,
    };
  }

  private compactDay(
    dateKey: string,
    record: RecordWithEntries | null,
    context: { profile: UserProfile | null; target: NutritionTarget | null },
  ) {
    const totals = this.diaryTotalsService.totals(record?.mealEntries ?? []);
    const waterMl = record?.waterMl ?? 0;
    const exerciseCalories = record?.exerciseCalories ?? 0;
    const dailyBurnKcal = dailyBurn(context.target);
    const targetCalories = context.target?.targetCalories ?? 0;
    const goal = context.profile?.goal;
    const compensationRatio = goal ? exerciseCompensationRatio[goal] : 0;
    const exerciseCompensationKcal = exerciseCalories * compensationRatio;
    const recommendedIntakeKcal = targetCalories + exerciseCompensationKcal;
    const plannedDeficitOrSurplusKcal = dailyBurnKcal - targetCalories;
    const deficitOrSurplusKcal = dailyBurnKcal + exerciseCalories - totals.calories;
    const planGapKcal = deficitOrSurplusKcal - plannedDeficitOrSurplusKcal;
    return {
      dateKey,
      calories: totals.calories,
      proteinG: totals.proteinG,
      carbsG: totals.carbsG,
      totalFatG: totals.totalFatG,
      fiberG: totals.fiberG,
      waterMl,
      exerciseCalories,
      dailyBurnKcal,
      deficitOrSurplusKcal,
      plannedDeficitOrSurplusKcal,
      recommendedIntakeKcal,
      exerciseCompensationKcal,
      planGapKcal,
    };
  }

  private emptyCompactDay(
    dateKey: string,
    context: { profile: UserProfile | null; target: NutritionTarget | null },
  ) {
    return this.compactDay(dateKey, null, context);
  }

  private averageCompactDays(
    records: RecordWithEntries[],
    context: { profile: UserProfile | null; target: NutritionTarget | null },
  ) {
    if (records.length === 0) {
      return this.emptyCompactDay('average', context);
    }
    const items = records.map((record) => this.compactDay(record.dateKey, record, context));
    return {
      dateKey: 'average',
      calories: average(items.map((item) => item.calories)),
      proteinG: average(items.map((item) => item.proteinG)),
      carbsG: average(items.map((item) => item.carbsG)),
      totalFatG: average(items.map((item) => item.totalFatG)),
      fiberG: average(items.map((item) => item.fiberG)),
      waterMl: average(items.map((item) => item.waterMl)),
      exerciseCalories: average(items.map((item) => item.exerciseCalories)),
      dailyBurnKcal: average(items.map((item) => item.dailyBurnKcal)),
      deficitOrSurplusKcal: average(items.map((item) => item.deficitOrSurplusKcal)),
      plannedDeficitOrSurplusKcal: average(
        items.map((item) => item.plannedDeficitOrSurplusKcal),
      ),
      recommendedIntakeKcal: average(items.map((item) => item.recommendedIntakeKcal)),
      exerciseCompensationKcal: average(
        items.map((item) => item.exerciseCompensationKcal),
      ),
      planGapKcal: average(items.map((item) => item.planGapKcal)),
    };
  }

  private scores(
    compact: ReturnType<AnalyticsService['compactDay']>,
    hydration: ReturnType<typeof hydrationFor>,
    target: NutritionTarget | null,
    sevenDayRecords: RecordWithEntries[],
  ) {
    if (!target) {
      return { nutritionScore: 0, hydrationScore: 0, consistencyScore: 0 };
    }

    const calorieScore = scoreRatio(
      compact.calories,
      target.targetCalories,
      compact.calories > target.targetCalories ? 0.2 : 0,
    );
    const proteinScore = scoreRatio(compact.proteinG, target.proteinG);
    const fiberScore = scoreRatio(compact.fiberG, target.fiberG);
    const hydrationScore = clamp(hydration.hydrationPercent - (hydration.hasFiberWaterWarning ? 15 : 0), 0, 100);
    const loggedDays = sevenDayRecords.filter(
      (record) => record.mealEntries.length > 0 || record.waterMl > 0,
    ).length;

    return {
      nutritionScore: Math.round((calorieScore * 0.4 + proteinScore * 0.35 + fiberScore * 0.25)),
      hydrationScore: Math.round(hydrationScore),
      consistencyScore: Math.round(clamp((loggedDays / 7) * 100, 0, 100)),
    };
  }

  private comparisonDateKeys(dateKey: string) {
    return [
      dateKey,
      addDaysKey(dateKey, -1),
      ...this.previousDateKeys(dateKey, 7),
    ];
  }

  private previousDateKeys(dateKey: string, count: number) {
    return Array.from({ length: count }, (_, index) => addDaysKey(dateKey, -index));
  }
}

function hydrationFor(fiberG: number, waterMl: number, target: NutritionTarget | null) {
  if (!target) {
    return {
      baseWaterGoalMl: 0,
      additionalWaterFromFiberMl: 0,
      totalRecommendedWaterMl: 0,
      waterRemainingMl: 0,
      hydrationPercent: 0,
      status: 'low',
      hasFiberWaterWarning: false,
    };
  }
  const baseWaterGoalMl = target?.waterMl ?? 0;
  const targetFiberG = target?.fiberG ?? 0;
  const additionalWaterFromFiberMl = clamp(Math.max(0, fiberG - targetFiberG) * 50, 0, 1000);
  const totalRecommendedWaterMl = baseWaterGoalMl + additionalWaterFromFiberMl;
  const waterRemainingMl = Math.max(0, totalRecommendedWaterMl - waterMl);
  const hydrationPercent =
    totalRecommendedWaterMl <= 0 ? 0 : clamp((waterMl / totalRecommendedWaterMl) * 100, 0, 100);
  const hasFiberWaterWarning = fiberG > targetFiberG && waterMl < totalRecommendedWaterMl * 0.85;
  return {
    baseWaterGoalMl,
    additionalWaterFromFiberMl,
    totalRecommendedWaterMl,
    waterRemainingMl,
    hydrationPercent,
    status: hydrationStatus(hydrationPercent, hasFiberWaterWarning),
    hasFiberWaterWarning,
  };
}

function insightsFor(
  compact: ReturnType<AnalyticsService['compactDay']>,
  hydration: ReturnType<typeof hydrationFor>,
  scores: { nutritionScore: number; hydrationScore: number; consistencyScore: number },
  target: NutritionTarget | null,
) {
  if (!target) {
    return [{ type: 'setup', severity: 'info', messageKey: 'analytics_setup_target' }];
  }
  const insights: Array<{ type: string; severity: string; messageKey: string; value?: number }> = [];
  if (compact.proteinG < target.proteinG) {
    insights.push({
      type: 'protein',
      severity: compact.proteinG < target.proteinG * 0.7 ? 'warning' : 'info',
      messageKey: 'analytics_need_protein',
      value: target.proteinG - compact.proteinG,
    });
  }
  if (hydration.hasFiberWaterWarning) {
    insights.push({
      type: 'hydration',
      severity: 'warning',
      messageKey: 'analytics_fiber_water_warning',
      value: hydration.waterRemainingMl,
    });
  }
  if (compact.deficitOrSurplusKcal > 0) {
    insights.push({
      type: 'energy',
      severity: 'info',
      messageKey: 'analytics_deficit_fat_estimate',
      value: Math.abs(compact.deficitOrSurplusKcal) / KCAL_PER_KG,
    });
  } else if (compact.deficitOrSurplusKcal < -200) {
    insights.push({
      type: 'energy',
      severity: 'warning',
      messageKey: 'analytics_surplus_warning',
      value: Math.abs(compact.deficitOrSurplusKcal),
    });
  }
  if (scores.nutritionScore >= 85 && scores.hydrationScore >= 85) {
    insights.push({ type: 'score', severity: 'success', messageKey: 'analytics_day_on_track' });
  }
  return insights.length ? insights : [{ type: 'general', severity: 'info', messageKey: 'analytics_log_more' }];
}

function hydrationStatus(percent: number, warning: boolean) {
  if (warning || percent < 60) return 'severe_low';
  if (percent < 85) return 'low';
  return 'good';
}

function dailyBurn(target: NutritionTarget | null) {
  return target?.dailyTotalBurnKcal || target?.tdee || 0;
}

function scoreRatio(value: number, target: number, overPenalty = 0) {
  if (target <= 0) return 0;
  const ratio = value / target;
  const score = ratio <= 1 ? ratio * 100 : Math.max(0, 100 - (ratio - 1) * 100 * (1 + overPenalty));
  return clamp(score, 0, 100);
}

function summarize(values: number[]) {
  if (values.length === 0) {
    return { min: 0, max: 0, average: 0, trendDirection: 'flat' as TrendDirection };
  }
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    average: average(values),
    trendDirection: trend(first, last),
  };
}

function trend(first: number, last: number): TrendDirection {
  if (Math.abs(last - first) < 1) return 'flat';
  return last > first ? 'up' : 'down';
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dateKeysBetween(from: string, to: string) {
  const start = parseDateKey(from);
  const end = parseDateKey(to);
  if (start.getTime() > end.getTime()) return [];
  const count = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return Array.from({ length: count }, (_, index) => formatDateKey(new Date(start.getTime() + index * DAY_MS)));
}

function addDaysKey(dateKey: string, days: number) {
  return formatDateKey(new Date(parseDateKey(dateKey).getTime() + days * DAY_MS));
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
