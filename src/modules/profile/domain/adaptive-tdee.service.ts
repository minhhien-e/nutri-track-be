export interface WeightLog {
  measuredDate: Date;
  weightKg: number;
}

export interface DailyMealRecord {
  mealEntries: { calories: number }[];
  exerciseCalories: number;
}

export class AdaptiveTdeeService {
  private static readonly MIN_ADAPTIVE_TDEE_DAYS = 14;
  private static readonly MIN_ADAPTIVE_MEAL_LOG_DAYS = 7;
  private static readonly ACTUAL_TDEE_MIN_RATIO = 0.75;
  private static readonly ACTUAL_TDEE_MAX_RATIO = 1.25;
  private static readonly KCAL_PER_KG = 7700;

  public static calculateActualTdee(
    estimatedTdee: number,
    logs: WeightLog[],
    records: DailyMealRecord[],
    windowDays: number,
  ): number | null {
    if (logs.length < 2) return null;
    if (windowDays < this.MIN_ADAPTIVE_TDEE_DAYS) return null;

    const mealRecords = records.filter((r) => r.mealEntries.length > 0);
    if (mealRecords.length < this.MIN_ADAPTIVE_MEAL_LOG_DAYS) return null;

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
      ((first.weightKg - latest.weightKg) * this.KCAL_PER_KG) / windowDays;

    const calculatedActualTdee =
      averageCalories + dailyEnergyDelta - averageLoggedExerciseCalories;

    // Clamp actual TDEE
    return Math.min(
      estimatedTdee * this.ACTUAL_TDEE_MAX_RATIO,
      Math.max(estimatedTdee * this.ACTUAL_TDEE_MIN_RATIO, calculatedActualTdee),
    );
  }
}
