import { MealType } from "@prisma/client";
import { FoodItem } from "../../foods/domain/food-item";

export class MealEntry {
  public readonly id: string;
  public readonly foodItem: FoodItem;
  public readonly mealType: MealType;
  public readonly grams: number;
  public calories: number;
  public proteinG: number;
  public carbsG: number;
  public fatG: number;
  public totalFatG: number;
  public saturatedFatG: number;
  public omega3G: number;
  public transFatG: number;
  public fiberG: number;

  constructor(data: {
    id: string;
    foodItem: FoodItem;
    mealType: MealType;
    grams: number;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    totalFatG?: number;
    saturatedFatG?: number;
    omega3G?: number;
    transFatG?: number;
    fiberG?: number;
  }) {
    this.id = data.id;
    this.foodItem = data.foodItem;
    this.mealType = data.mealType;
    this.grams = data.grams;

    if (
      data.calories !== undefined &&
      data.proteinG !== undefined &&
      data.carbsG !== undefined &&
      data.fatG !== undefined
    ) {
      this.calories = data.calories;
      this.proteinG = data.proteinG;
      this.carbsG = data.carbsG;
      this.fatG = data.fatG;
      this.totalFatG = data.totalFatG ?? data.fatG;
      this.saturatedFatG = data.saturatedFatG ?? 0;
      this.omega3G = data.omega3G ?? 0;
      this.transFatG = data.transFatG ?? 0;
      this.fiberG = data.fiberG ?? 0;
    } else {
      this.recalculateNutrients();
    }
  }

  public recalculateNutrients(): void {
    const scaled = this.foodItem.scaleToNutrients(this.grams);
    this.calories = scaled.calories;
    this.proteinG = scaled.proteinG;
    this.carbsG = scaled.carbsG;
    this.fatG = scaled.fatG;
    this.totalFatG = scaled.totalFatG;
    this.saturatedFatG = scaled.saturatedFatG;
    this.omega3G = scaled.omega3G;
    this.transFatG = scaled.transFatG;
    this.fiberG = scaled.fiberG;
  }
}
