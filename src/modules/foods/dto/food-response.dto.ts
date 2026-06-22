import { FoodItem, FoodSource } from '@prisma/client';

export type FoodResponseDto = {
  id: string;
  name: string;
  brandName: string | null;
  servingSizeG: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  totalFatPer100g: number;
  saturatedFatPer100g: number;
  omega3Per100g: number;
  transFatPer100g: number;
  fiberPer100g: number;
  source: FoodSource;
  imageAssetPath: string | null;
  category: string | null;
  displayTag: string | null;
};

export function toFoodResponse(food: FoodItem): FoodResponseDto {
  return {
    id: food.id,
    name: food.name,
    brandName: food.brandName,
    servingSizeG: food.servingSizeG,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
    totalFatPer100g: food.totalFatPer100g,
    saturatedFatPer100g: food.saturatedFatPer100g,
    omega3Per100g: food.omega3Per100g,
    transFatPer100g: food.transFatPer100g,
    fiberPer100g: food.fiberPer100g,
    source: food.source,
    imageAssetPath: food.imageAssetPath,
    category: food.category,
    displayTag: food.displayTag,
  };
}
