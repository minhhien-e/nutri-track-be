import { FoodSource } from "@prisma/client";
import { AdminFoodsService } from "./admin-foods.service";

describe("AdminFoodsService", () => {
  it("upserts catalog food instead of always creating a new row", async () => {
    const repository = {
      upsertCatalog: jest.fn().mockResolvedValue({ id: "food-1" }),
    };
    const service = new AdminFoodsService(repository as never, {} as never);

    await service.create({
      name: "Nạc dăm heo sống",
      servingSizeG: 100,
      caloriesPer100g: 216,
      proteinPer100g: 18.5,
      carbsPer100g: 0,
      totalFatPer100g: 15.5,
    });

    expect(repository.upsertCatalog).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Nạc dăm heo sống",
        source: FoodSource.adminCatalog,
        fatPer100g: 15.5,
        totalFatPer100g: 15.5,
        isActive: true,
        ownerUserId: null,
      }),
    );
  });
});
