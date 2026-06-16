import type { User } from "./user.aggregate";
import { NutritionPlan } from "./nutrition-plan";
import { Gender, Goal } from "@prisma/client";

export class NutritionPlanFactory {
  private static readonly MIN_TARGET_CALORIES = 1200;
  private static readonly MAX_TARGET_CALORIES = 5000;
  private static readonly FAT_MIN_G_PER_KG = 0.5;
  private static readonly FIBER_G_PER_1000_KCAL = 14;
  private static readonly WATER_ML_PER_KG = 30;

  public static createPlan(user: User, actualTdee: number | null = null): NutritionPlan {
    this.validateGoalDirection(user);

    const body = user.bodyProfile;
    const activity = user.activityProfile;
    const goal = user.goalProfile;

    const bmr = body.calculateBMR();
    const dailyBaseBurnKcal = bmr;
    const estimatedTdee = bmr * activity.calculateActivityFactor();
    const tdee = actualTdee ?? estimatedTdee;

    const dailyActivityBurnKcal = Math.max(0, tdee - dailyBaseBurnKcal);
    const dailyTotalBurnKcal = tdee;

    // Tính số ngày của kế hoạch
    const start = this.startOfDay(user.startDate);
    const target = this.startOfDay(user.targetDate);
    const days = Math.max(1, Math.ceil((target.getTime() - start.getTime()) / 86_400_000));

    const dailyEnergyAdjustmentKcal = goal.calculateCalorieAdjustment(tdee, body, user.targetWeightKg, days);
    
    // Tính target calories
    const rawTargetCalories =
      goal.getGoalType() === Goal.loseWeight
        ? dailyTotalBurnKcal - dailyEnergyAdjustmentKcal
        : goal.getGoalType() === Goal.gainWeight
          ? dailyTotalBurnKcal + dailyEnergyAdjustmentKcal
          : dailyTotalBurnKcal;

    const targetCalories = Math.min(
      this.MAX_TARGET_CALORIES,
      Math.max(this.MIN_TARGET_CALORIES, rawTargetCalories)
    );

    // Tính macro targets
    const proteinG = body.weightKg * goal.getProteinFactor();
    const { carbsG, totalFatG } = this.calculateMacros(
      goal.getGoalType(),
      body.weightKg,
      targetCalories,
      proteinG,
      goal.getFatFactor(),
      goal.getCarbFloor()
    );

    const fiberG = (targetCalories / 1000) * this.FIBER_G_PER_1000_KCAL;
    const waterMl = body.weightKg * this.WATER_ML_PER_KG;
    const saturatedFatLimitG = (targetCalories * 0.1) / 9;
    const omega3TargetG = body.gender === Gender.male ? 1.6 : 1.1;

    return new NutritionPlan({
      startDate: start,
      startWeightKg: body.weightKg,
      targetWeightKg: user.targetWeightKg,
      targetDate: target,
      bmr,
      tdee,
      estimatedTdee,
      actualTdee,
      actualTdeeCalculatedAt: actualTdee === null ? null : new Date(),
      actualTdeeWindowDays: null, // Sẽ được cập nhật từ DB mapper hoặc Domain Service ngoài
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
      waterMl,
      saturatedFatLimitG,
      omega3TargetG,
      transFatLimitG: 0,
      macroRatio: "manual_exercise_baseline_v1",
      calculatedAt: new Date(),
    });
  }

  private static calculateMacros(
    goal: Goal,
    weightKg: number,
    targetCalories: number,
    proteinG: number,
    fatFactor: number,
    carbFloorG: number
  ) {
    const proteinCalories = proteinG * 4;
    const fatBaseG = weightKg * fatFactor;
    const fatMinG = weightKg * this.FAT_MIN_G_PER_KG;
    
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

  private static validateGoalDirection(user: User) {
    const start = this.startOfDay(user.startDate);
    const target = this.startOfDay(user.targetDate);
    const goalType = user.goalProfile.getGoalType();

    if (
      goalType !== Goal.maintainWeight &&
      target.getTime() <= start.getTime()
    ) {
      throw new Error("Target date must be after start date");
    }
    if (
      goalType === Goal.loseWeight &&
      user.targetWeightKg >= user.bodyProfile.weightKg
    ) {
      throw new Error(
        "Lose weight goal requires target weight lower than current weight",
      );
    }
    if (
      goalType === Goal.gainWeight &&
      user.targetWeightKg <= user.bodyProfile.weightKg
    ) {
      throw new Error(
        "Gain weight goal requires target weight higher than current weight",
      );
    }
  }

  private static startOfDay(value: Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
}
