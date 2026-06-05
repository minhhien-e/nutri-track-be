import { Injectable } from "@nestjs/common";
import { Goal, NutritionTarget } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CalculateNutritionTargetDto } from "./dto/calculate-nutrition-target.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { NutritionTargetService } from "./nutrition-target.service";

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nutritionTargetService: NutritionTargetService,
  ) {}

  getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({ where: { userId } });
  }

  getNutritionTarget(userId: string) {
    return this.prisma.nutritionTarget.findUnique({ where: { userId } });
  }

  calculateTarget(dto: CalculateNutritionTargetDto) {
    return this.nutritionTargetService.calculate(dto);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profileData = {
      age: dto.age,
      gender: dto.gender,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      activityLevel: dto.activityLevel,
      goal: dto.goal,
    };
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData },
    });
    const target = this.nutritionTargetService.calculate(dto);
    const nutritionTarget = await this.prisma.nutritionTarget.upsert({
      where: { userId },
      update: target,
      create: { userId, ...target },
    });
    return { profile, nutritionTarget };
  }

  async getTargetOverview(userId: string) {
    const [profile, nutritionTarget] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);
    if (!profile || !nutritionTarget) return null;

    const dateKey = new Date().toISOString().slice(0, 10);
    const record = await this.prisma.dailyRecord.findUnique({
      where: { userId_dateKey: { userId, dateKey } },
      include: { mealEntries: true },
    });
    const todayTotals = (record?.mealEntries ?? []).reduce(
      (sum, entry) => ({
        calories: sum.calories + entry.calories,
        proteinG: sum.proteinG + entry.proteinG,
        carbsG: sum.carbsG + entry.carbsG,
        totalFatG: sum.totalFatG + (entry.totalFatG || entry.fatG),
        saturatedFatG: sum.saturatedFatG + entry.saturatedFatG,
        omega3G: sum.omega3G + entry.omega3G,
        transFatG: sum.transFatG + entry.transFatG,
        fiberG: sum.fiberG + entry.fiberG,
      }),
      {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        totalFatG: 0,
        saturatedFatG: 0,
        omega3G: 0,
        transFatG: 0,
        fiberG: 0,
      },
    );
    const waterMl = record?.waterMl ?? 0;
    const consumedCalories = todayTotals.calories;
    const loggedExerciseCalories = record?.exerciseCalories ?? 0;
    const projectedNetCalories = consumedCalories - loggedExerciseCalories;
    const clampedNetCalories = Math.max(0, projectedNetCalories);
    const baseRemainingFoodCalories = Math.max(
      0,
      nutritionTarget.targetCalories - consumedCalories,
    );
    const exerciseCreditCalories = loggedExerciseCalories;
    const remainingFoodCalories = Math.max(
      0,
      nutritionTarget.targetCalories +
        exerciseCreditCalories -
        consumedCalories,
    );
    const overTargetCalories = Math.max(
      0,
      consumedCalories -
        nutritionTarget.targetCalories -
        exerciseCreditCalories,
    );
    const exerciseCaloriesToBurn = overTargetCalories;
    const totalDelta = Math.abs(
      nutritionTarget.startWeightKg - nutritionTarget.targetWeightKg,
    );
    const completedDelta = Math.abs(
      nutritionTarget.startWeightKg - profile.weightKg,
    );
    const progressPercent =
      totalDelta <= 0
        ? 100
        : Math.min(100, Math.max(0, (completedDelta / totalDelta) * 100));
    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (nutritionTarget.targetDate.getTime() - Date.now()) / 86_400_000,
      ),
    );
    const statusKeys = this.getStatusKeys(
      nutritionTarget,
      { ...todayTotals, calories: projectedNetCalories },
      waterMl,
    );
    const dailyBurnKcal =
      nutritionTarget.dailyTotalBurnKcal || nutritionTarget.tdee;
    const dailyAdjustmentKcal =
      profile.goal === Goal.maintainWeight
        ? 0
        : nutritionTarget.dailyEnergyAdjustmentKcal;
    const adjustmentType =
      profile.goal === Goal.loseWeight
        ? "deficit"
        : profile.goal === Goal.gainWeight
          ? "surplus"
          : "maintain";
    const targetSummaryKey =
      profile.goal === Goal.loseWeight
        ? "eat_less_than_burn"
        : profile.goal === Goal.gainWeight
          ? "eat_more_than_burn"
          : "eat_equal_burn";

    return {
      profile,
      nutritionTarget,
      progress: {
        currentWeightKg: profile.weightKg,
        startWeightKg: nutritionTarget.startWeightKg,
        targetWeightKg: nutritionTarget.targetWeightKg,
        remainingWeightKg: Math.abs(
          profile.weightKg - nutritionTarget.targetWeightKg,
        ),
        daysRemaining,
        progressPercent,
      },
      burn: {
        bmr: nutritionTarget.bmr,
        dailyBaseBurnKcal:
          nutritionTarget.dailyBaseBurnKcal || nutritionTarget.bmr,
        dailyActivityBurnKcal: nutritionTarget.dailyActivityBurnKcal,
        dailyTotalBurnKcal:
          nutritionTarget.dailyTotalBurnKcal || nutritionTarget.tdee,
      },
      caloriePlan: {
        goal: profile.goal,
        goalMode: profile.goal,
        targetCalories: nutritionTarget.targetCalories,
        dailyIntakeTargetKcal: nutritionTarget.targetCalories,
        dailyBurnKcal,
        dailyAdjustmentKcal,
        dailyEnergyAdjustmentKcal: nutritionTarget.dailyEnergyAdjustmentKcal,
        plannedDailyDeficitKcal:
          profile.goal === Goal.loseWeight
            ? nutritionTarget.dailyEnergyAdjustmentKcal
            : 0,
        adjustmentType,
        targetSummaryKey,
      },
      targets: {
        calories: nutritionTarget.targetCalories,
        proteinG: nutritionTarget.proteinG,
        carbsG: nutritionTarget.carbsG,
        totalFatG: nutritionTarget.totalFatG || nutritionTarget.fatG,
        fiberG: nutritionTarget.fiberG,
        waterMl: nutritionTarget.waterMl,
        saturatedFatLimitG: nutritionTarget.saturatedFatLimitG,
        omega3TargetG: nutritionTarget.omega3TargetG,
        transFatLimitG: nutritionTarget.transFatLimitG,
      },
      today: {
        ...todayTotals,
        waterMl,
        consumedCalories,
        baseRemainingFoodCalories,
        exerciseCreditCalories,
        remainingFoodCalories,
        overTargetCalories,
        loggedExerciseCalories,
        exerciseCaloriesToBurn,
        projectedNetCalories,
        clampedNetCalories,
        exerciseCalories: loggedExerciseCalories,
        netCalories: projectedNetCalories,
      },
      statusKeys,
    };
  }

  private getStatusKeys(
    target: NutritionTarget,
    totals: {
      calories: number;
      proteinG: number;
      fiberG: number;
      transFatG: number;
    },
    waterMl: number,
  ) {
    const statusKeys: string[] = [];
    if (totals.calories > target.targetCalories)
      statusKeys.push("need_reduce_calories");
    if (totals.proteinG < target.proteinG * 0.85)
      statusKeys.push("low_protein");
    if (totals.fiberG < target.fiberG * 0.85) statusKeys.push("low_fiber");
    if (waterMl < target.waterMl * 0.85) statusKeys.push("need_more_water");
    if (totals.transFatG > target.transFatLimitG)
      statusKeys.push("has_trans_fat");
    return statusKeys.length ? statusKeys : ["on_track"];
  }
}
