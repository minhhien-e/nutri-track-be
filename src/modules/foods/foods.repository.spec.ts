import { FoodsRepository } from './foods.repository';

describe('FoodsRepository', () => {
  it('limits user search to active public foods and active user custom foods', async () => {
    const prisma = {
      foodItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const repository = new FoodsRepository(prisma as never);

    await repository.search({ page: 1, limit: 20, keyword: 'rice' }, 'user-1');

    expect(prisma.foodItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { ownerUserId: null, isActive: true },
                { ownerUserId: 'user-1', isActive: true },
              ]),
            }),
          ]),
        }),
      }),
    );
  });
});
