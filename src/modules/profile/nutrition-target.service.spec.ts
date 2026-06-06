import { ActivityLevel, Gender, Goal } from '@prisma/client';
import { NutritionTargetService } from './nutrition-target.service';

describe('NutritionTargetService', () => {
  it('calculates BMR, TDEE and nutrient minimums', () => {
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

    expect(result.tdee).toBeCloseTo(2491.625);
    expect(result.dailyBaseBurnKcal).toBeCloseTo(1607.5);
    expect(result.dailyActivityBurnKcal).toBeCloseTo(884.125);
    expect(result.dailyEnergyAdjustmentKcal).toBeCloseTo(385);
    expect(result.targetCalories).toBeCloseTo(2106.625);
    expect(result.proteinG).toBeCloseTo(54.4);
    expect(result.carbsG).toBe(130);
    expect(result.totalFatG).toBeCloseTo(34);
    expect(result.fiberG).toBeCloseTo(29.49, 1);
    expect(result.waterMl).toBe(2040);
    expect(result.saturatedFatLimitG).toBeCloseTo(23.41, 1);
    expect(result.omega3TargetG).toBe(1.6);
    expect(result.transFatLimitG).toBe(0);
    expect(result.macroRatio).toBe('minimums');
  });

  it('keeps nutrient minimums based on weight when calories are clamped low', () => {
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
    expect(result.proteinG).toBe(36);
    expect(result.carbsG).toBe(130);
    expect(result.totalFatG).toBeCloseTo(22.5);
    expect(result.fiberG).toBeCloseTo(16.8);
  });

  it('keeps nutrient minimums based on weight when calories are clamped high', () => {
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
    expect(result.proteinG).toBe(280);
    expect(result.carbsG).toBe(130);
    expect(result.totalFatG).toBeCloseTo(175);
    expect(result.fiberG).toBeCloseTo(70);
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
