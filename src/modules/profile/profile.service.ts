import { BadRequestException, Injectable } from "@nestjs/common";
import { Goal, NutritionTarget } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CalculateNutritionTargetDto } from "./dto/calculate-nutrition-target.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpsertWeeklyWeightLogDto } from "./dto/upsert-weekly-weight-log.dto";
import {
  MACRO_FORMULA_VERSION,
  NutritionTargetService,
} from "./nutrition-target.service";
import { AdaptiveTdeeService } from "./domain/adaptive-tdee.service";

const DAY_MS = 86_400_000;
const KCAL_PER_KG = 7700;

const exerciseCompensationRatio: Record<Goal, number> = {
  loseWeight: 0.4,
  maintainWeight: 0.7,
  gainWeight: 0.9,
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nutritionTargetService: NutritionTargetService,
  ) {}

  getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({ where: { userId } });
  }

  async getNutritionTarget(userId: string) {
    const [profile, nutritionTarget] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);
    if (!profile || !nutritionTarget) return nutritionTarget;
    const normalized = await this.normalizeNutritionTarget(
      userId,
      profile,
      nutritionTarget,
    );
    return this.refreshAdaptiveTdee(userId, profile, normalized);
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
      update: { ...target, actualTdee: null, actualTdeeCalculatedAt: null, actualTdeeWindowDays: null },
      create: { userId, ...target },
    });
    return { profile, nutritionTarget };
  }

  async getTargetJourney(userId: string) {
    const [profile, storedNutritionTarget] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);
    if (!profile || !storedNutritionTarget) return null;
    const normalizedNutritionTarget = await this.normalizeNutritionTarget(
      userId,
      profile,
      storedNutritionTarget,
    );
    const nutritionTarget = await this.refreshAdaptiveTdee(
      userId,
      profile,
      normalizedNutritionTarget,
    );

    const startDate = this.startOfDay(
      nutritionTarget.startDate ?? nutritionTarget.calculatedAt,
    );
    const targetDate = this.startOfDay(nutritionTarget.targetDate);
    const dayCount = Math.max(
      0,
      Math.round((targetDate.getTime() - startDate.getTime()) / DAY_MS),
    );
    const dateKeys = Array.from({ length: dayCount + 1 }, (_, index) =>
      this.dateKey(addDays(startDate, index)),
    );
    const records = await this.prisma.dailyRecord.findMany({
      where: { userId, dateKey: { in: dateKeys } },
      include: { mealEntries: true },
      orderBy: { dateKey: "asc" },
    });
    const recordsByDate = new Map(
      records.map((record) => [record.dateKey, record]),
    );
    const dailyBurnKcal =
      nutritionTarget.dailyTotalBurnKcal || nutritionTarget.tdee;
    const plannedDeficitKcal =
      profile.goal === Goal.maintainWeight
        ? 0
        : profile.goal === Goal.loseWeight
          ? nutritionTarget.dailyEnergyAdjustmentKcal
          : -nutritionTarget.dailyEnergyAdjustmentKcal;

    let cumulativeDeficitKcal = 0;
    const cumulativeByDateKey = new Map<string, number>();
    const dailyEnergyPoints = dateKeys.map((dateKey) => {
      const record = recordsByDate.get(dateKey);
      const hasLoggedData =
        record != null &&
        (record.mealEntries.length > 0 || record.exerciseCalories > 0);
      const consumedCalories = (record?.mealEntries ?? []).reduce(
        (sum, entry) => sum + entry.calories,
        0,
      );
      const exerciseCalories = record?.exerciseCalories ?? 0;
      const actualDeficitKcal = hasLoggedData
        ? dailyBurnKcal + exerciseCalories - consumedCalories
        : 0;
      cumulativeDeficitKcal += actualDeficitKcal;
      cumulativeByDateKey.set(dateKey, cumulativeDeficitKcal);
      return {
        dateKey,
        hasLoggedData,
        consumedCalories,
        exerciseCalories,
        dailyBurnKcal,
        actualDeficitKcal,
        plannedDeficitKcal,
        cumulativeDeficitKcal,
      };
    });

    const weeklyLogs = await this.prisma.weeklyWeightLog.findMany({
      where: { userId, measuredDate: { gte: startDate, lte: targetDate } },
      orderBy: { measuredDate: "asc" },
    });
    const logsByWeek = new Map(weeklyLogs.map((log) => [log.weekKey, log]));
    const totalWeightDelta =
      nutritionTarget.targetWeightKg - nutritionTarget.startWeightKg;
    const weeklyWeightPoints = this.weekStartsBetween(
      startDate,
      targetDate,
    ).map((weekStart) => {
      const weekEnd = minDate(addDays(weekStart, 6), targetDate);
      const weekKey = this.isoWeekKey(weekStart);
      const elapsedDays = Math.max(
        0,
        Math.min(
          dayCount,
          Math.round((weekEnd.getTime() - startDate.getTime()) / DAY_MS),
        ),
      );
      const progress = dayCount <= 0 ? 1 : elapsedDays / dayCount;
      const plannedWeightKg =
        nutritionTarget.startWeightKg + totalWeightDelta * progress;
      const cumulative = cumulativeByDateKey.get(this.dateKey(weekEnd)) ?? 0;
      const projectedWeightKg =
        nutritionTarget.startWeightKg - cumulative / KCAL_PER_KG;
      const log = logsByWeek.get(weekKey);
      return {
        weekKey,
        weekStartDate: weekStart.toISOString(),
        weekEndDate: weekEnd.toISOString(),
        plannedWeightKg,
        projectedWeightKg,
        loggedWeightKg: log?.weightKg ?? null,
        measuredDate: log?.measuredDate?.toISOString() ?? null,
      };
    });

    return {
      startDate: startDate.toISOString(),
      targetDate: targetDate.toISOString(),
      startWeightKg: nutritionTarget.startWeightKg,
      targetWeightKg: nutritionTarget.targetWeightKg,
      dailyEnergyPoints,
      weeklyWeightPoints,
    };
  }

  async upsertWeeklyWeightLog(userId: string, dto: UpsertWeeklyWeightLogDto) {
    const measuredDate = this.startOfDay(dto.measuredDate);
    const weekKey = this.isoWeekKey(measuredDate);
    const log = await this.prisma.weeklyWeightLog.upsert({
      where: { userId_weekKey: { userId, weekKey } },
      update: { measuredDate, weightKg: dto.weightKg },
      create: { userId, weekKey, measuredDate, weightKg: dto.weightKg },
    });
    const [profile, target] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);
    if (profile && target) {
      const normalized = await this.normalizeNutritionTarget(userId, profile, target);
      await this.refreshAdaptiveTdee(userId, profile, normalized);
    }
    return log;
  }

  async deleteWeeklyWeightLog(userId: string, weekKey: string) {
    if (!/^\d{4}-W\d{2}$/.test(weekKey)) {
      throw new BadRequestException("Invalid week key");
    }
    await this.prisma.weeklyWeightLog.deleteMany({
      where: { userId, weekKey },
    });
    return { deleted: true };
  }

  async getTargetOverview(userId: string) {
    const [profile, storedNutritionTarget] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);
    if (!profile || !storedNutritionTarget) return null;
    const normalizedNutritionTarget = await this.normalizeNutritionTarget(
      userId,
      profile,
      storedNutritionTarget,
    );
    const nutritionTarget = await this.refreshAdaptiveTdee(
      userId,
      profile,
      normalizedNutritionTarget,
    );

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
    const dailyBurnKcal =
      nutritionTarget.dailyTotalBurnKcal || nutritionTarget.tdee;
    const plannedDeficitOrSurplusKcal =
      dailyBurnKcal - nutritionTarget.targetCalories;
    const actualDeficitOrSurplusKcal =
      dailyBurnKcal + loggedExerciseCalories - consumedCalories;
    const exerciseCompensationKcal =
      loggedExerciseCalories * exerciseCompensationRatio[profile.goal];
    const recommendedIntakeKcal =
      nutritionTarget.targetCalories + exerciseCompensationKcal;
    const planGapKcal =
      actualDeficitOrSurplusKcal - plannedDeficitOrSurplusKcal;
    const baseRemainingFoodCalories = Math.max(
      0,
      nutritionTarget.targetCalories - consumedCalories,
    );
    const exerciseCreditCalories = exerciseCompensationKcal;
    const remainingFoodCalories = Math.max(
      0,
      recommendedIntakeKcal - consumedCalories,
    );
    const overTargetCalories = Math.max(
      0,
      consumedCalories - recommendedIntakeKcal,
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
        estimatedTdee: nutritionTarget.estimatedTdee || dailyBurnKcal,
        actualTdee: nutritionTarget.actualTdee,
        activeTdee: dailyBurnKcal,
        actualTdeeCalculatedAt: nutritionTarget.actualTdeeCalculatedAt,
        dailyAdjustmentKcal,
        dailyEnergyAdjustmentKcal: nutritionTarget.dailyEnergyAdjustmentKcal,
        plannedDeficitOrSurplusKcal,
        recommendedIntakeKcal,
        exerciseCompensationKcal,
        planGapKcal,
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
        plannedDeficitOrSurplusKcal,
        actualDeficitOrSurplusKcal,
        recommendedIntakeKcal,
        exerciseCompensationKcal,
        planGapKcal,
        projectedNetCalories,
        clampedNetCalories,
        exerciseCalories: loggedExerciseCalories,
        netCalories: projectedNetCalories,
      },
      statusKeys,
    };
  }

  private async normalizeNutritionTarget(
    userId: string,
    profile: {
      age: number;
      gender: UpdateProfileDto["gender"];
      heightCm: number;
      weightKg: number;
      activityLevel: UpdateProfileDto["activityLevel"];
      goal: Goal;
    },
    target: NutritionTarget,
  ) {
    if (target.macroRatio === MACRO_FORMULA_VERSION) return target;
    try {
      const recalculated = this.nutritionTargetService.calculate({
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        startDate: target.startDate ?? target.calculatedAt,
        targetWeightKg: target.targetWeightKg,
        targetDate: target.targetDate,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      });
      return this.prisma.nutritionTarget.upsert({
        where: { userId },
        update: recalculated,
        create: { userId, ...recalculated },
      });
    } catch {
      return target;
    }
  }

  private async refreshAdaptiveTdee(
    userId: string,
    profile: {
      age: number;
      gender: UpdateProfileDto["gender"];
      heightCm: number;
      weightKg: number;
      activityLevel: UpdateProfileDto["activityLevel"];
      goal: Goal;
    },
    target: NutritionTarget,
  ) {
    if (typeof this.prisma.weeklyWeightLog?.findMany !== "function") {
      return target;
    }
    const logs = await this.prisma.weeklyWeightLog.findMany({
      where: {
        userId,
        measuredDate: { gte: target.startDate ?? target.calculatedAt },
      },
      orderBy: { measuredDate: "asc" },
    });
    if (logs.length < 2) return target;

    const first = logs[0];
    const latest = logs[logs.length - 1];
    const firstDate = this.startOfDay(first.measuredDate);
    const latestDate = this.startOfDay(latest.measuredDate);
    const windowDays = Math.round(
      (latestDate.getTime() - firstDate.getTime()) / DAY_MS,
    );

    const dateKeys = this.dateKeysBetween(firstDate, latestDate);
    const records = await this.prisma.dailyRecord.findMany({
      where: { userId, dateKey: { in: dateKeys } },
      include: { mealEntries: true },
    });

    const estimatedTdee = target.estimatedTdee || target.tdee;
    const actualTdee = AdaptiveTdeeService.calculateActualTdee(
      estimatedTdee,
      logs,
      records,
      windowDays,
    );

    if (actualTdee === null) {
      return target;
    }

    if (
      target.actualTdee != null &&
      Math.abs(target.actualTdee - actualTdee) < 1 &&
      target.actualTdeeWindowDays === windowDays
    ) {
      return target;
    }

    const recalculated = this.nutritionTargetService.calculate(
      {
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        startDate: target.startDate ?? target.calculatedAt,
        targetWeightKg: target.targetWeightKg,
        targetDate: target.targetDate,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
      },
      { actualTdee },
    );
    return this.prisma.nutritionTarget.update({
      where: { userId },
      data: {
        ...recalculated,
        actualTdee,
        actualTdeeCalculatedAt: new Date(),
        actualTdeeWindowDays: windowDays,
      },
    });
  }

  private startOfDay(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  private dateKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private isoWeekKey(value: Date) {
    const date = this.startOfDay(value);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
      ((date.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7,
    );
    return `${date.getUTCFullYear()}-W${week.toString().padStart(2, "0")}`;
  }

  private dateKeysBetween(startDate: Date, endDate: Date) {
    const dayCount = Math.max(
      0,
      Math.round(
        (this.startOfDay(endDate).getTime() - this.startOfDay(startDate).getTime()) /
          DAY_MS,
      ),
    );
    return Array.from({ length: dayCount + 1 }, (_, index) =>
      this.dateKey(addDays(startDate, index)),
    );
  }

  private weekStartsBetween(startDate: Date, targetDate: Date) {
    const first = this.startOfDay(startDate);
    const day = first.getUTCDay() || 7;
    first.setUTCDate(first.getUTCDate() - day + 1);
    const weeks: Date[] = [];
    for (
      let cursor = first;
      cursor.getTime() <= targetDate.getTime();
      cursor = addDays(cursor, 7)
    ) {
      weeks.push(cursor);
    }
    return weeks;
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

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function minDate(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b;
}
