import type { User } from "./user.aggregate";
import { NutritionPlan } from "./nutrition-plan";
import { Gender, Goal } from "@prisma/client";
import { NUTRITION_CONFIG } from "../../../config/nutrition.config";
import { MacroStrategyFactory } from "./macro-distribution.strategies";

export class NutritionPlanFactory {
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
      NUTRITION_CONFIG.maxTargetCalories,
      Math.max(NUTRITION_CONFIG.minTargetCalories, rawTargetCalories)
    );

    // Tính macro targets dựa trên strategy
    const macroStrategy = MacroStrategyFactory.create(user.macroRatio);
    const { proteinG, carbsG, fatG } = macroStrategy.calculateMacros(
      targetCalories,
      body.weightKg,
      goal.getGoalType()
    );

    const fiberG = (targetCalories / 1000) * NUTRITION_CONFIG.fiberGPer1000Kcal;
    const waterMl = body.weightKg * NUTRITION_CONFIG.waterMlPerKg;
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
      actualTdeeWindowDays: null,
      dailyBaseBurnKcal,
      dailyActivityBurnKcal,
      dailyTotalBurnKcal,
      dailyEnergyAdjustmentKcal,
      targetCalories,
      proteinG,
      carbsG,
      fatG,
      totalFatG: fatG,
      fiberG,
      waterMl,
      saturatedFatLimitG,
      omega3TargetG,
      transFatLimitG: 0,
      macroRatio: user.macroRatio,
      calculatedAt: new Date(),
    });
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
