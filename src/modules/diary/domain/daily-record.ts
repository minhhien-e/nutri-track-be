import { MealEntry } from "./meal-entry";
import type { NutritionPlan } from "../../profile/domain/nutrition-plan";

export interface NutrientTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  totalFatG: number;
  saturatedFatG: number;
  omega3G: number;
  transFatG: number;
  fiberG: number;
}

export class DailyRecord {
  public readonly id: string;
  public readonly userId: string;
  public readonly dateKey: string;
  public readonly waterMl: number;
  public readonly exerciseCalories: number;
  public readonly entries: MealEntry[];

  constructor(data: {
    id: string;
    userId: string;
    dateKey: string;
    waterMl: number;
    exerciseCalories: number;
    entries: MealEntry[];
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.dateKey = data.dateKey;
    this.waterMl = data.waterMl;
    this.exerciseCalories = data.exerciseCalories;
    this.entries = data.entries;
  }

  public getTotalNutrients(): NutrientTotals {
    return this.entries.reduce<NutrientTotals>(
      (sum, entry) => ({
        calories: sum.calories + entry.calories,
        proteinG: sum.proteinG + entry.proteinG,
        carbsG: sum.carbsG + entry.carbsG,
        fatG: sum.fatG + entry.fatG,
        totalFatG: sum.totalFatG + entry.totalFatG,
        saturatedFatG: sum.saturatedFatG + entry.saturatedFatG,
        omega3G: sum.omega3G + entry.omega3G,
        transFatG: sum.transFatG + entry.transFatG,
        fiberG: sum.fiberG + entry.fiberG,
      }),
      {
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        totalFatG: 0,
        saturatedFatG: 0,
        omega3G: 0,
        transFatG: 0,
        fiberG: 0,
      },
    );
  }

  public getNetCalories(): number {
    const total = this.getTotalNutrients();
    return total.calories - this.exerciseCalories;
  }

  public getStatusWarnings(targetPlan: NutritionPlan): string[] {
    const totals = this.getTotalNutrients();
    const netCalories = this.getNetCalories();
    const warnings: string[] = [];

    if (netCalories > targetPlan.targetCalories) {
      warnings.push("need_reduce_calories");
    }
    if (totals.proteinG < targetPlan.proteinG * 0.85) {
      warnings.push("low_protein");
    }
    if (totals.fiberG < targetPlan.fiberG * 0.85) {
      warnings.push("low_fiber");
    }
    if (this.waterMl < targetPlan.waterMl * 0.85) {
      warnings.push("need_more_water");
    }
    if (totals.transFatG > targetPlan.transFatLimitG) {
      warnings.push("has_trans_fat");
    }

    return warnings.length > 0 ? warnings : ["on_track"];
  }
}
