import { Injectable } from "@nestjs/common";
import { FoodItem } from "../foods/domain/food-item";

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
  id?: string;
  name?: string;
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
    const domainFood = new FoodItem({
      id: food.id ?? "temp-id",
      name: food.name ?? "temp-name",
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
      totalFatPer100g: food.totalFatPer100g,
      saturatedFatPer100g: food.saturatedFatPer100g,
      omega3Per100g: food.omega3Per100g,
      transFatPer100g: food.transFatPer100g,
      fiberPer100g: food.fiberPer100g,
    });
    return domainFood.scaleToNutrients(grams);
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
