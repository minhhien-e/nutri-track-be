import { FoodSource } from '@prisma/client';
import { FoodsService } from './foods.service';

const food = {
  id: 'rice',
  name: 'Cơm trắng',
  brandName: null,
  servingSizeG: 100,
  caloriesPer100g: 130,
  proteinPer100g: 2.7,
  carbsPer100g: 28.2,
  fatPer100g: 0.3,
  totalFatPer100g: 0.3,
  saturatedFatPer100g: 0.1,
  omega3Per100g: 0,
  transFatPer100g: 0,
  fiberPer100g: 0.4,
  source: FoodSource.adminCatalog,
  imageAssetPath: 'assets/images/food_rice.png',
  category: 'Tinh bột',
  displayTag: 'Món chính',
  isActive: true,
  ownerUserId: null,
  createdAt: new Date('2026-06-04T00:00:00.000Z'),
  updatedAt: new Date('2026-06-04T00:00:00.000Z'),
};

describe('FoodsService', () => {
  it('maps search results to user-facing food DTOs', async () => {
    const repository = {
      search: jest.fn().mockResolvedValue({
        items: [food],
        hasMore: false,
        nextCursor: null,
        total: 1,
      }),
    };
    const service = new FoodsService(repository as never);

    const result = await service.search({ page: 1, limit: 20 }, 'user-1');

    expect(result).toMatchObject({
      hasMore: false,
      nextCursor: null,
      total: 1,
      items: [
        {
          id: 'rice',
          name: 'Cơm trắng',
          totalFatPer100g: 0.3,
          source: FoodSource.adminCatalog,
        },
      ],
    });
    expect(result.items[0]).not.toHaveProperty('isActive');
    expect(result.items[0]).not.toHaveProperty('ownerUserId');
    expect(result.items[0]).not.toHaveProperty('createdAt');
    expect(result.items[0]).not.toHaveProperty('updatedAt');
  });

  it('returns recent foods as a flat food DTO list', async () => {
    const repository = {
      getRecent: jest.fn().mockResolvedValue([{ foodItem: food }]),
    };
    const service = new FoodsService(repository as never);

    const result = await service.getRecent('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'rice', totalFatPer100g: 0.3 });
    expect(result[0]).not.toHaveProperty('foodItem');
  });
});
