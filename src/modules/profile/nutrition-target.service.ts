import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { BodyProfile } from "./domain/body-profile";
import { ActivityProfile } from "./domain/activity-profile";
import { GoalProfileFactory } from "./domain/goal-profile.strategies";
import { User } from "./domain/user.aggregate";

export const MACRO_FORMULA_VERSION = "manual_exercise_baseline_v1";

@Injectable()
export class NutritionTargetService {
  calculate(profile: UpdateProfileDto, options?: { actualTdee?: number | null }) {
    try {
      const body = new BodyProfile(
        profile.gender,
        profile.age,
        profile.heightCm,
        profile.weightKg
      );
      const activity = new ActivityProfile(profile.activityLevel);
      const goal = GoalProfileFactory.create(profile.goal);
      const user = new User(
        "temp-user-id", // temporary ID for calculation purposes
        body,
        activity,
        goal,
        profile.startDate ?? new Date(),
        profile.targetWeightKg,
        profile.targetDate
      );
      
      const plan = user.generateNutritionPlan(options?.actualTdee);
      
      return {
        startDate: plan.startDate,
        startWeightKg: plan.startWeightKg,
        targetWeightKg: plan.targetWeightKg,
        targetDate: plan.targetDate,
        bmr: plan.bmr,
        tdee: plan.tdee,
        estimatedTdee: plan.estimatedTdee,
        actualTdee: plan.actualTdee,
        actualTdeeCalculatedAt: plan.actualTdeeCalculatedAt,
        actualTdeeWindowDays: plan.actualTdeeWindowDays,
        dailyBaseBurnKcal: plan.dailyBaseBurnKcal,
        dailyActivityBurnKcal: plan.dailyActivityBurnKcal,
        dailyTotalBurnKcal: plan.dailyTotalBurnKcal,
        dailyEnergyAdjustmentKcal: plan.dailyEnergyAdjustmentKcal,
        targetCalories: plan.targetCalories,
        proteinG: plan.proteinG,
        carbsG: plan.carbsG,
        fatG: plan.fatG,
        totalFatG: plan.totalFatG,
        fiberG: plan.fiberG,
        waterMl: plan.waterMl,
        saturatedFatLimitG: plan.saturatedFatLimitG,
        omega3TargetG: plan.omega3TargetG,
        transFatLimitG: plan.transFatLimitG,
        macroRatio: plan.macroRatio,
        calculatedAt: plan.calculatedAt,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
