export class FoodItem {
  public readonly id: string;
  public readonly name: string;
  public readonly caloriesPer100g: number;
  public readonly proteinPer100g: number;
  public readonly carbsPer100g: number;
  public readonly fatPer100g: number;
  public readonly totalFatPer100g: number;
  public readonly saturatedFatPer100g: number;
  public readonly omega3Per100g: number;
  public readonly transFatPer100g: number;
  public readonly fiberPer100g: number;

  constructor(data: {
    id: string;
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    totalFatPer100g?: number;
    saturatedFatPer100g?: number;
    omega3Per100g?: number;
    transFatPer100g?: number;
    fiberPer100g?: number;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.caloriesPer100g = data.caloriesPer100g;
    this.proteinPer100g = data.proteinPer100g;
    this.carbsPer100g = data.carbsPer100g;
    this.fatPer100g = data.fatPer100g;
    this.totalFatPer100g = data.totalFatPer100g ?? data.fatPer100g;
    this.saturatedFatPer100g = data.saturatedFatPer100g ?? 0;
    this.omega3Per100g = data.omega3Per100g ?? 0;
    this.transFatPer100g = data.transFatPer100g ?? 0;
    this.fiberPer100g = data.fiberPer100g ?? 0;
  }

  public scaleToNutrients(grams: number) {
    const ratio = grams / 100;
    const totalFatG = this.totalFatPer100g * ratio;
    return {
      calories: this.caloriesPer100g * ratio,
      proteinG: this.proteinPer100g * ratio,
      carbsG: this.carbsPer100g * ratio,
      fatG: totalFatG,
      totalFatG,
      saturatedFatG: this.saturatedFatPer100g * ratio,
      omega3G: this.omega3Per100g * ratio,
      transFatG: this.transFatPer100g * ratio,
      fiberG: this.fiberPer100g * ratio,
    };
  }
}
