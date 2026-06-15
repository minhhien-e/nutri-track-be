import { AnalyticsService } from './analytics.service';
import { DiaryTotalsService } from '../diary/diary-totals.service';

const target = {
  waterMl: 2100,
  fiberG: 25,
  targetCalories: 2000,
  proteinG: 120,
  dailyTotalBurnKcal: 2400,
  tdee: 2400,
};

const profile = { id: 'profile-1' };

function createService(records: unknown[] = [], nutritionTarget: unknown = target) {
  const prisma = {
    userProfile: { findUnique: jest.fn().mockResolvedValue(profile) },
    nutritionTarget: { findUnique: jest.fn().mockResolvedValue(nutritionTarget) },
    dailyRecord: {
      findMany: jest.fn().mockResolvedValue(records),
    },
  };
  const service = new AnalyticsService(prisma as never, new DiaryTotalsService());
  return { service, prisma };
}

function record(dateKey: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: `record-${dateKey}`,
    userId: 'user-1',
    dateKey,
    waterMl: 2100,
    exerciseCalories: 300,
    updatedAt: new Date(),
    mealEntries: [
      {
        calories: 1800,
        proteinG: 100,
        carbsG: 180,
        fatG: 55,
        totalFatG: 55,
        saturatedFatG: 10,
        omega3G: 0.8,
        transFatG: 0,
        fiberG: 35,
      },
    ],
    ...overrides,
  };
}

describe('AnalyticsService', () => {
  it('builds daily analytics with hydration, scores and insights', async () => {
    const { service } = createService([record('2026-06-15')]);

    const result = await service.getDaily('user-1', '2026-06-15');

    expect(result.nutrition.calories).toBe(1800);
    expect(result.hydration.additionalWaterFromFiberMl).toBe(500);
    expect(result.hydration.totalRecommendedWaterMl).toBe(2600);
    expect(result.energy.deficitOrSurplusKcal).toBe(900);
    expect(result.energy.estimatedFatKg).toBeCloseTo(900 / 7700);
    expect(result.scores.nutritionScore).toBeGreaterThanOrEqual(0);
    expect(result.scores.nutritionScore).toBeLessThanOrEqual(100);
    expect(result.insights.some((item) => item.messageKey === 'analytics_fiber_water_warning')).toBe(true);
  });

  it('does not add water when fiber is below target and clamps added water', async () => {
    const { service: lowFiberService } = createService([
      record('2026-06-15', {
        mealEntries: [{ calories: 1000, proteinG: 60, carbsG: 120, fatG: 25, totalFatG: 25, fiberG: 10 }],
      }),
    ]);
    const lowFiber = await lowFiberService.getDaily('user-1', '2026-06-15');
    expect(lowFiber.hydration.additionalWaterFromFiberMl).toBe(0);

    const { service: highFiberService } = createService([
      record('2026-06-15', {
        mealEntries: [{ calories: 1000, proteinG: 60, carbsG: 120, fatG: 25, totalFatG: 25, fiberG: 80 }],
      }),
    ]);
    const highFiber = await highFiberService.getDaily('user-1', '2026-06-15');
    expect(highFiber.hydration.additionalWaterFromFiberMl).toBe(1000);
  });

  it('returns zero-safe analytics without a nutrition target', async () => {
    const { service } = createService([record('2026-06-15')], null);

    const result = await service.getDaily('user-1', '2026-06-15');

    expect(result.hydration.totalRecommendedWaterMl).toBe(0);
    expect(result.scores).toEqual({
      nutritionScore: 0,
      hydrationScore: 0,
      consistencyScore: 0,
    });
    expect(result.insights[0].messageKey).toBe('analytics_setup_target');
  });

  it('summarizes range values and trend', async () => {
    const { service } = createService([
      record('2026-06-13', { waterMl: 1000, mealEntries: [{ calories: 1000, proteinG: 60, carbsG: 100, fatG: 20, totalFatG: 20, fiberG: 10 }] }),
      record('2026-06-14', { waterMl: 1500, mealEntries: [{ calories: 1500, proteinG: 80, carbsG: 150, fatG: 35, totalFatG: 35, fiberG: 20 }] }),
      record('2026-06-15', { waterMl: 2000, mealEntries: [{ calories: 2000, proteinG: 100, carbsG: 200, fatG: 50, totalFatG: 50, fiberG: 30 }] }),
    ]);

    const result = await service.getRange('user-1', '2026-06-13', '2026-06-15');

    expect(result.series).toHaveLength(3);
    expect(result.summary.calories.min).toBe(1000);
    expect(result.summary.calories.max).toBe(2000);
    expect(result.summary.calories.average).toBe(1500);
    expect(result.summary.calories.trendDirection).toBe('up');
  });
});
