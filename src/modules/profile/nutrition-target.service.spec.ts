import { ActivityLevel, Gender, Goal } from '@prisma/client';
import { NutritionTargetService } from './nutrition-target.service';

describe('NutritionTargetService', () => {
  it('calculates base TDEE and goal/activity macros for weight loss', () => {
    const service = new NutritionTargetService();
    const result = service.calculate({
      age: 28,
      gender: Gender.male,
      heightCm: 170,
      weightKg: 68,
      targetWeightKg: 63,
      targetDate: new Date(Date.now() + 100 * 86_400_000),
      activityLevel: ActivityLevel.moderatelyActive,
      goal: Goal.loseWeight,
    });

    expect(result.tdee).toBeCloseTo(1929);
    expect(result.dailyBaseBurnKcal).toBeCloseTo(1607.5);
    expect(result.dailyActivityBurnKcal).toBeCloseTo(321.5);
    expect(result.dailyEnergyAdjustmentKcal).toBeCloseTo(385);
    expect(result.targetCalories).toBeCloseTo(1544);
    expect(result.proteinG).toBeCloseTo(122.4);
    expect(result.carbsG).toBeCloseTo(171.8);
    expect(result.totalFatG).toBeCloseTo(40.8);
    expect(result.fiberG).toBeCloseTo(21.62, 1);
    expect(result.waterMl).toBe(2040);
    expect(result.saturatedFatLimitG).toBeCloseTo(17.16, 1);
    expect(result.omega3TargetG).toBe(1.6);
    expect(result.transFatLimitG).toBe(0);
    expect(result.macroRatio).toBe('goal_activity_v1');
  });

  it('uses goal macros when calories are clamped low', () => {
    const service = new NutritionTargetService();
    const result = service.calculate({
      age: 40,
      gender: Gender.female,
      heightCm: 150,
      weightKg: 45,
      targetWeightKg: 35,
      targetDate: new Date(Date.now() + 365 * 86_400_000),
      activityLevel: ActivityLevel.sedentary,
      goal: Goal.loseWeight,
    });

    expect(result.targetCalories).toBe(1200);
    expect(result.proteinG).toBe(72);
    expect(result.carbsG).toBeCloseTo(167.25);
    expect(result.totalFatG).toBeCloseTo(27);
    expect(result.fiberG).toBeCloseTo(16.8);
  });

  it('reduces fat to the floor before letting carbs fall below the goal floor', () => {
    const service = new NutritionTargetService();
    const result = service.calculate({
      age: 25,
      gender: Gender.male,
      heightCm: 220,
      weightKg: 350,
      targetWeightKg: 390,
      targetDate: new Date(Date.now() + 30 * 86_400_000),
      activityLevel: ActivityLevel.extraActive,
      goal: Goal.gainWeight,
    });

    expect(result.targetCalories).toBe(5000);
    expect(result.proteinG).toBe(700);
    expect(result.carbsG).toBeCloseTo(156.25);
    expect(result.totalFatG).toBeCloseTo(175);
    expect(result.fiberG).toBeCloseTo(70);
  });

  it('keeps maintenance calories at base burn while activity changes macros', () => {
    const service = new NutritionTargetService();
    const result = service.calculate({
      age: 30,
      gender: Gender.male,
      heightCm: 170,
      weightKg: 70,
      targetWeightKg: 70,
      targetDate: new Date(Date.now() + 100 * 86_400_000),
      activityLevel: ActivityLevel.veryActive,
      goal: Goal.maintainWeight,
    });

    expect(result.tdee).toBeCloseTo(1941);
    expect(result.dailyEnergyAdjustmentKcal).toBe(0);
    expect(result.targetCalories).toBeCloseTo(1941);
    expect(result.proteinG).toBeCloseTo(112);
    expect(result.totalFatG).toBeCloseTo(56);
    expect(result.carbsG).toBeCloseTo(247.25);
  });

  it('uses higher carb floor for weight gain when calories allow it', () => {
    const service = new NutritionTargetService();
    const result = service.calculate({
      age: 30,
      gender: Gender.male,
      heightCm: 170,
      weightKg: 70,
      targetWeightKg: 72,
      targetDate: new Date(Date.now() + 100 * 86_400_000),
      activityLevel: ActivityLevel.lightlyActive,
      goal: Goal.gainWeight,
    });

    expect(result.proteinG).toBeCloseTo(119);
    expect(result.totalFatG).toBeCloseTo(56);
    expect(result.carbsG).toBeGreaterThanOrEqual(180);
    expect(result.macroRatio).toBe('goal_activity_v1');
  });

  it('rejects goal directions that conflict with target weight', () => {
    const service = new NutritionTargetService();

    expect(() =>
      service.calculate({
        age: 28,
        gender: Gender.male,
        heightCm: 170,
        weightKg: 68,
        targetWeightKg: 70,
        targetDate: new Date(Date.now() + 100 * 86_400_000),
        activityLevel: ActivityLevel.moderatelyActive,
        goal: Goal.loseWeight,
      }),
    ).toThrow('Lose weight goal requires target weight lower than current weight');

    expect(() =>
      service.calculate({
        age: 28,
        gender: Gender.male,
        heightCm: 170,
        weightKg: 68,
        targetWeightKg: 65,
        targetDate: new Date(Date.now() + 100 * 86_400_000),
        activityLevel: ActivityLevel.moderatelyActive,
        goal: Goal.gainWeight,
      }),
    ).toThrow('Gain weight goal requires target weight higher than current weight');
  });
});
