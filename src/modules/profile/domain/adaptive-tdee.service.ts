import { NUTRITION_CONFIG } from "../../../config/nutrition.config";

export interface WeightLog {
  measuredDate: Date;
  weightKg: number;
}

export interface DailyMealRecord {
  mealEntries: { calories: number }[];
  exerciseCalories: number;
}

export class AdaptiveTdeeService {
  public static calculateActualTdee(
    estimatedTdee: number,
    logs: WeightLog[],
    records: DailyMealRecord[],
    windowDays: number,
  ): number | null {
    if (logs.length < 2) return null;
    if (windowDays < NUTRITION_CONFIG.minAdaptiveTdeeDays) return null;

    const mealRecords = records.filter((r) => r.mealEntries.length > 0);
    if (mealRecords.length < NUTRITION_CONFIG.minAdaptiveMealLogDays) return null;

    const first = logs[0];
    const latest = logs[logs.length - 1];

    const totalCalories = mealRecords.reduce(
      (sum, r) => sum + r.mealEntries.reduce((es, e) => es + e.calories, 0),
      0,
    );
    const averageCalories = totalCalories / mealRecords.length;
    const averageLoggedExerciseCalories =
      records.reduce((sum, r) => sum + (r.exerciseCalories ?? 0), 0) / windowDays;
    const dailyEnergyDelta =
      ((first.weightKg - latest.weightKg) * NUTRITION_CONFIG.kcalPerKg) / windowDays;

    const calculatedActualTdee =
      averageCalories + dailyEnergyDelta - averageLoggedExerciseCalories;

    // Clamp actual TDEE
    return Math.min(
      estimatedTdee * NUTRITION_CONFIG.actualTdeeMaxRatio,
      Math.max(estimatedTdee * NUTRITION_CONFIG.actualTdeeMinRatio, calculatedActualTdee),
    );
  }
}
