import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityLevel, Gender, Goal } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

const KCAL_PER_KG = 7700;
const MIN_TARGET_CALORIES = 1200;
const MAX_TARGET_CALORIES = 5000;
export const MACRO_FORMULA_VERSION = 'goal_activity_v1';
const BASE_ACTIVITY_FACTOR = 1.2;
const FAT_MIN_G_PER_KG = 0.5;
const FIBER_G_PER_1000_KCAL = 14;
const WATER_ML_PER_KG = 30;

const proteinByGoalAndActivity: Record<Goal, Record<ActivityLevel, number>> = {
  loseWeight: {
    sedentary: 1.6,
    lightlyActive: 1.7,
    moderatelyActive: 1.8,
    veryActive: 2.0,
    extraActive: 2.0,
  },
  maintainWeight: {
    sedentary: 1.2,
    lightlyActive: 1.3,
    moderatelyActive: 1.4,
    veryActive: 1.6,
    extraActive: 1.6,
  },
  gainWeight: {
    sedentary: 1.6,
    lightlyActive: 1.7,
    moderatelyActive: 1.8,
    veryActive: 2.0,
    extraActive: 2.0,
  },
};

const fatByGoal: Record<Goal, number> = {
  loseWeight: 0.6,
  maintainWeight: 0.8,
  gainWeight: 0.8,
};

const carbFloorByGoal: Record<Goal, number> = {
  loseWeight: 80,
  maintainWeight: 130,
  gainWeight: 180,
};

@Injectable()
export class NutritionTargetService {
  calculate(profile: UpdateProfileDto) {
    this.validateGoalDirection(profile);
    const genderOffset = profile.gender === Gender.male ? 5 : -161;
    const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + genderOffset;
    const dailyBaseBurnKcal = bmr;
    const dailyActivityBurnKcal = bmr * (BASE_ACTIVITY_FACTOR - 1);
    const dailyTotalBurnKcal = dailyBaseBurnKcal + dailyActivityBurnKcal;
    const tdee = dailyTotalBurnKcal;
    const days = Math.max(1, Math.ceil((profile.targetDate.getTime() - Date.now()) / 86_400_000));
    const dailyEnergyAdjustmentKcal =
      profile.goal === Goal.maintainWeight ? 0 : (Math.abs(profile.weightKg - profile.targetWeightKg) * KCAL_PER_KG) / days;
    const rawTargetCalories =
      profile.goal === Goal.loseWeight
        ? dailyTotalBurnKcal - dailyEnergyAdjustmentKcal
        : profile.goal === Goal.gainWeight
          ? dailyTotalBurnKcal + dailyEnergyAdjustmentKcal
          : dailyTotalBurnKcal;
    const targetCalories = Math.min(MAX_TARGET_CALORIES, Math.max(MIN_TARGET_CALORIES, rawTargetCalories));
    const proteinG = profile.weightKg * proteinByGoalAndActivity[profile.goal][profile.activityLevel];
    const macros = this.calculateMacros(profile.goal, profile.weightKg, targetCalories, proteinG);
    const carbsG = macros.carbsG;
    const totalFatG = macros.totalFatG;
    const fiberG = (targetCalories / 1000) * FIBER_G_PER_1000_KCAL;
    return {
      startWeightKg: profile.weightKg,
      targetWeightKg: profile.targetWeightKg,
      targetDate: profile.targetDate,
      bmr,
      tdee,
      dailyBaseBurnKcal,
      dailyActivityBurnKcal,
      dailyTotalBurnKcal,
      dailyEnergyAdjustmentKcal,
      targetCalories,
      proteinG,
      carbsG,
      fatG: totalFatG,
      totalFatG,
      fiberG,
      waterMl: profile.weightKg * WATER_ML_PER_KG,
      saturatedFatLimitG: (targetCalories * 0.1) / 9,
      omega3TargetG: profile.gender === Gender.male ? 1.6 : 1.1,
      transFatLimitG: 0,
      macroRatio: MACRO_FORMULA_VERSION,
      calculatedAt: new Date(),
    };
  }

  private calculateMacros(goal: Goal, weightKg: number, targetCalories: number, proteinG: number) {
    const proteinCalories = proteinG * 4;
    const fatBaseG = weightKg * fatByGoal[goal];
    const fatMinG = weightKg * FAT_MIN_G_PER_KG;
    const carbFloorG = carbFloorByGoal[goal];
    let totalFatG = fatBaseG;
    let carbsG = (targetCalories - proteinCalories - totalFatG * 9) / 4;

    if (carbsG < carbFloorG) {
      const fatAllowedWithCarbFloor = (targetCalories - proteinCalories - carbFloorG * 4) / 9;
      totalFatG = Math.max(fatMinG, Math.min(fatBaseG, fatAllowedWithCarbFloor));
      carbsG = (targetCalories - proteinCalories - totalFatG * 9) / 4;
    }

    return {
      carbsG: Math.max(0, carbsG),
      totalFatG: Math.max(0, totalFatG),
    };
  }

  private validateGoalDirection(profile: UpdateProfileDto) {
    const targetTime = profile.targetDate.getTime();
    if (profile.goal !== Goal.maintainWeight && targetTime <= Date.now()) {
      throw new BadRequestException('Target date must be in the future');
    }
    if (profile.goal === Goal.loseWeight && profile.targetWeightKg >= profile.weightKg) {
      throw new BadRequestException('Lose weight goal requires target weight lower than current weight');
    }
    if (profile.goal === Goal.gainWeight && profile.targetWeightKg <= profile.weightKg) {
      throw new BadRequestException('Gain weight goal requires target weight higher than current weight');
    }
  }
}
