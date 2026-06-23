import { DiaryTotalsService } from '@/modules/diary/diary-totals.service';

describe('DiaryTotalsService', () => {
  it('scales food nutrition by grams', () => {
    const service = new DiaryTotalsService();
    const result = service.scaleFood(
      {
        caloriesPer100g: 130,
        proteinPer100g: 2.7,
        carbsPer100g: 28.2,
        fatPer100g: 0.3,
        totalFatPer100g: 0.3,
        saturatedFatPer100g: 0.1,
        omega3Per100g: 0.02,
        transFatPer100g: 0,
        fiberPer100g: 1.4,
      },
      150,
    );

    expect(result.calories).toBeCloseTo(195);
    expect(result.carbsG).toBeCloseTo(42.3);
    expect(result.totalFatG).toBeCloseTo(0.45);
    expect(result.saturatedFatG).toBeCloseTo(0.15);
    expect(result.omega3G).toBeCloseTo(0.03);
    expect(result.transFatG).toBeCloseTo(0);
    expect(result.fiberG).toBeCloseTo(2.1);
  });

  it('sums diary totals', () => {
    const service = new DiaryTotalsService();
    const result = service.totals([
      { calories: 100, proteinG: 10, carbsG: 12, fatG: 2, totalFatG: 2, saturatedFatG: 0.5, omega3G: 0.1, transFatG: 0, fiberG: 3 },
      { calories: 50, proteinG: 5, carbsG: 6, fatG: 1, totalFatG: 1, saturatedFatG: 0.2, omega3G: 0.3, transFatG: 0.1, fiberG: 2 },
    ]);

    expect(result).toEqual({
      calories: 150,
      proteinG: 15,
      carbsG: 18,
      fatG: 3,
      totalFatG: 3,
      saturatedFatG: 0.7,
      omega3G: 0.4,
      transFatG: 0.1,
      fiberG: 5,
    });
  });
});
