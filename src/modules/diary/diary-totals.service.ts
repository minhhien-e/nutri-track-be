import { Injectable } from '@nestjs/common';

type NutrientEntry = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  totalFatG?: number;
  saturatedFatG?: number;
  omega3G?: number;
  transFatG?: number;
  fiberG?: number;
};

type NutrientTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  totalFatG: number;
  saturatedFatG: number;
  omega3G: number;
  transFatG: number;
  fiberG: number;
};

type FoodForScaling = {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  totalFatPer100g?: number;
  saturatedFatPer100g?: number;
  omega3Per100g?: number;
  transFatPer100g?: number;
  fiberPer100g?: number;
};

@Injectable()
export class DiaryTotalsService {
  scaleFood(food: FoodForScaling, grams: number): NutrientEntry {
    const ratio = grams / 100;
    const totalFatG = (food.totalFatPer100g || food.fatPer100g) * ratio;
    return {
      calories: food.caloriesPer100g * ratio,
      proteinG: food.proteinPer100g * ratio,
      carbsG: food.carbsPer100g * ratio,
      fatG: totalFatG,
      totalFatG,
      saturatedFatG: (food.saturatedFatPer100g ?? 0) * ratio,
      omega3G: (food.omega3Per100g ?? 0) * ratio,
      transFatG: (food.transFatPer100g ?? 0) * ratio,
      fiberG: (food.fiberPer100g ?? 0) * ratio,
    };
  }

  totals(entries: NutrientEntry[]): NutrientTotals {
    return entries.reduce<NutrientTotals>(
      (sum, entry) => ({
        calories: sum.calories + entry.calories,
        proteinG: sum.proteinG + entry.proteinG,
        carbsG: sum.carbsG + entry.carbsG,
        fatG: sum.fatG + entry.fatG,
        totalFatG: sum.totalFatG + (entry.totalFatG ?? entry.fatG),
        saturatedFatG: sum.saturatedFatG + (entry.saturatedFatG ?? 0),
        omega3G: sum.omega3G + (entry.omega3G ?? 0),
        transFatG: sum.transFatG + (entry.transFatG ?? 0),
        fiberG: sum.fiberG + (entry.fiberG ?? 0),
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
}
