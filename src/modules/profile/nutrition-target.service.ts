import { BadRequestException, Injectable } from "@nestjs/common";
import { Gender, Goal } from "@prisma/client";
import { UpdateProfileDto } from "./dto/update-profile.dto";

const KCAL_PER_KG = 7700;
const MIN_TARGET_CALORIES = 1200;
const MAX_TARGET_CALORIES = 5000;
export const MACRO_FORMULA_VERSION = "manual_exercise_baseline_v1";
const MAX_LOSS_DEFICIT_KCAL = 750;
const MAX_LOSS_DEFICIT_TDEE_RATIO = 0.25;
const MAX_GAIN_SURPLUS_KCAL = 500;
const MAX_GAIN_SURPLUS_TDEE_RATIO = 0.15;
const BASELINE_ACTIVITY_FACTOR = 1.2;
const FAT_MIN_G_PER_KG = 0.5;
const FIBER_G_PER_1000_KCAL = 14;
const WATER_ML_PER_KG = 30;

const proteinByGoal: Record<Goal, number> = {
  loseWeight: 1.6,
  maintainWeight: 1.2,
  gainWeight: 1.6,
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
  calculate(profile: UpdateProfileDto, options?: { actualTdee?: number | null }) {
    this.validateGoalDirection(profile);
    const startDate = this.startOfDay(profile.startDate ?? new Date());
    const targetDate = this.startOfDay(profile.targetDate);
    const genderOffset = profile.gender === Gender.male ? 5 : -161;
    const bmr =
      10 * profile.weightKg +
      6.25 * profile.heightCm -
      5 * profile.age +
      genderOffset;
    const dailyBaseBurnKcal = bmr;
    const estimatedTdee = bmr * BASELINE_ACTIVITY_FACTOR;
    const actualTdee = options?.actualTdee ?? null;
    const tdee = actualTdee ?? estimatedTdee;
    const dailyActivityBurnKcal = Math.max(0, tdee - dailyBaseBurnKcal);
    const dailyTotalBurnKcal = tdee;
    const days = Math.max(
      1,
      Math.ceil((targetDate.getTime() - startDate.getTime()) / 86_400_000),
    );
    const rawDailyEnergyAdjustmentKcal =
      profile.goal === Goal.maintainWeight
        ? 0
        : (Math.abs(profile.weightKg - profile.targetWeightKg) * KCAL_PER_KG) /
          days;
    const dailyEnergyAdjustmentKcal = this.clampDailyEnergyAdjustment(
      profile.goal,
      tdee,
      rawDailyEnergyAdjustmentKcal,
    );
    const rawTargetCalories =
      profile.goal === Goal.loseWeight
        ? dailyTotalBurnKcal - dailyEnergyAdjustmentKcal
        : profile.goal === Goal.gainWeight
          ? dailyTotalBurnKcal + dailyEnergyAdjustmentKcal
          : dailyTotalBurnKcal;
    const targetCalories = Math.min(
      MAX_TARGET_CALORIES,
      Math.max(MIN_TARGET_CALORIES, rawTargetCalories),
    );
    const proteinG = profile.weightKg * proteinByGoal[profile.goal];
    const macros = this.calculateMacros(
      profile.goal,
      profile.weightKg,
      targetCalories,
      proteinG,
    );
    const carbsG = macros.carbsG;
    const totalFatG = macros.totalFatG;
    const fiberG = (targetCalories / 1000) * FIBER_G_PER_1000_KCAL;
    return {
      startDate,
      startWeightKg: profile.weightKg,
      targetWeightKg: profile.targetWeightKg,
      targetDate,
      bmr,
      tdee,
      estimatedTdee,
      actualTdee,
      actualTdeeCalculatedAt: actualTdee == null ? null : new Date(),
      actualTdeeWindowDays: null,
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

  private clampDailyEnergyAdjustment(
    goal: Goal,
    tdee: number,
    rawAdjustmentKcal: number,
  ) {
    if (goal === Goal.loseWeight) {
      return Math.min(
        rawAdjustmentKcal,
        MAX_LOSS_DEFICIT_KCAL,
        tdee * MAX_LOSS_DEFICIT_TDEE_RATIO,
      );
    }
    if (goal === Goal.gainWeight) {
      return Math.min(
        rawAdjustmentKcal,
        MAX_GAIN_SURPLUS_KCAL,
        tdee * MAX_GAIN_SURPLUS_TDEE_RATIO,
      );
    }
    return 0;
  }

  private calculateMacros(
    goal: Goal,
    weightKg: number,
    targetCalories: number,
    proteinG: number,
  ) {
    const proteinCalories = proteinG * 4;
    const fatBaseG = weightKg * fatByGoal[goal];
    const fatMinG = weightKg * FAT_MIN_G_PER_KG;
    const carbFloorG = carbFloorByGoal[goal];
    let totalFatG = fatBaseG;
    let carbsG = (targetCalories - proteinCalories - totalFatG * 9) / 4;

    if (carbsG < carbFloorG) {
      const fatAllowedWithCarbFloor =
        (targetCalories - proteinCalories - carbFloorG * 4) / 9;
      totalFatG = Math.max(
        fatMinG,
        Math.min(fatBaseG, fatAllowedWithCarbFloor),
      );
      carbsG = (targetCalories - proteinCalories - totalFatG * 9) / 4;
    }

    return {
      carbsG: Math.max(0, carbsG),
      totalFatG: Math.max(0, totalFatG),
    };
  }

  private validateGoalDirection(profile: UpdateProfileDto) {
    const startDate = this.startOfDay(profile.startDate ?? new Date());
    const targetDate = this.startOfDay(profile.targetDate);
    if (
      profile.goal !== Goal.maintainWeight &&
      targetDate.getTime() <= startDate.getTime()
    ) {
      throw new BadRequestException("Target date must be after start date");
    }
    if (
      profile.goal === Goal.loseWeight &&
      profile.targetWeightKg >= profile.weightKg
    ) {
      throw new BadRequestException(
        "Lose weight goal requires target weight lower than current weight",
      );
    }
    if (
      profile.goal === Goal.gainWeight &&
      profile.targetWeightKg <= profile.weightKg
    ) {
      throw new BadRequestException(
        "Gain weight goal requires target weight higher than current weight",
      );
    }
  }

  private startOfDay(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
}
