import { FoodsRepository } from "./foods.repository";

describe("FoodsRepository", () => {
  it("limits user search to active public foods and active user custom foods", async () => {
    const prisma = {
      foodItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const repository = new FoodsRepository(prisma as never);

    await repository.search({ page: 1, limit: 20, keyword: "rice" }, "user-1");

    expect(prisma.foodItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { ownerUserId: null, isActive: true },
                { ownerUserId: "user-1", isActive: true },
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it("creates catalog food when no matching name and brand exist", async () => {
    const transaction = {
      foodItem: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: "food-1" }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const repository = new FoodsRepository(prisma as never);

    await repository.upsertCatalog({
      name: " Nạc dăm heo sống ",
      brandName: "",
      servingSizeG: 100,
      caloriesPer100g: 216,
      proteinPer100g: 18.5,
      carbsPer100g: 0,
      fatPer100g: 15.5,
      totalFatPer100g: 15.5,
      source: "adminCatalog",
    });

    expect(transaction.foodItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Nạc dăm heo sống",
        brandName: null,
        ownerUserId: null,
        isActive: true,
      }),
    });
  });

  it("overwrites the canonical catalog food and disables old duplicates", async () => {
    const transaction = {
      foodItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: "canonical" }, { id: "duplicate" }]),
        update: jest.fn().mockResolvedValue({ id: "canonical" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const repository = new FoodsRepository(prisma as never);

    await repository.upsertCatalog({
      name: "nạc dăm heo sống",
      brandName: null,
      servingSizeG: 100,
      caloriesPer100g: 220,
      proteinPer100g: 19,
      carbsPer100g: 0,
      fatPer100g: 16,
      totalFatPer100g: 16,
      source: "adminCatalog",
    });

    expect(transaction.foodItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerUserId: null,
          name: {
            equals: "nạc dăm heo sống",
            mode: "insensitive",
          },
        }),
      }),
    );
    expect(transaction.foodItem.update).toHaveBeenCalledWith({
      where: { id: "canonical" },
      data: expect.objectContaining({
        caloriesPer100g: 220,
        isActive: true,
      }),
    });
    expect(transaction.foodItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["duplicate"] } },
      data: { isActive: false },
    });
  });
});
