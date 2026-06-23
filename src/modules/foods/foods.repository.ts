import { Injectable } from "@nestjs/common";
import { FoodSource, Prisma } from "@prisma/client";
import { PrismaService } from '@/database/prisma.service';
import { CreateCustomFoodDto } from '@/modules/foods/dto/create-custom-food.dto';
import { FoodQueryDto } from '@/modules/foods/dto/food-query.dto';

@Injectable()
export class FoodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: FoodQueryDto, userId?: string) {
    const where: Prisma.FoodItemWhereInput = {
      AND: [
        query.keyword
          ? {
              OR: [
                {
                  id: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  name: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  category: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  displayTag: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            }
          : {},
        query.category ? { category: query.category } : {},
        {
          OR: [
            { ownerUserId: null, isActive: true },
            userId ? { ownerUserId: userId, isActive: true } : {},
          ],
        },
      ],
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.foodItem.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { name: "asc" },
      }),
      this.prisma.foodItem.count({ where }),
    ]);
    return {
      items,
      hasMore: skip + items.length < total,
      nextCursor: skip + items.length < total ? String(query.page + 1) : null,
      total,
    };
  }

  findById(id: string) {
    return this.prisma.foodItem.findFirst({ where: { id, isActive: true } });
  }

  findAnyById(id: string) {
    return this.prisma.foodItem.findUnique({ where: { id } });
  }

  getRecent(userId: string) {
    return this.prisma.recentFood.findMany({
      where: { userId, foodItem: { isActive: true } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { foodItem: true },
    });
  }

  markRecent(userId: string, foodItemId: string) {
    return this.prisma.recentFood.upsert({
      where: { userId_foodItemId: { userId, foodItemId } },
      update: { createdAt: new Date() },
      create: { userId, foodItemId },
      include: { foodItem: true },
    });
  }

  createCustom(userId: string, dto: CreateCustomFoodDto) {
    return this.prisma.foodItem.create({
      data: {
        ...dto,
        totalFatPer100g: dto.totalFatPer100g ?? dto.fatPer100g,
        transFatPer100g: dto.transFatPer100g ?? 0,
        source: FoodSource.custom,
        isActive: true,
        ownerUserId: userId,
      },
    });
  }

  async adminSearch(query: {
    keyword?: string;
    category?: string;
    source?: FoodSource;
    isActive?: boolean;
    page: number;
    limit: number;
  }) {
    const where: Prisma.FoodItemWhereInput = {
      ownerUserId: null,
      AND: [
        query.keyword
          ? {
              OR: [
                {
                  id: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  name: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  brandName: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  category: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  displayTag: {
                    contains: query.keyword,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            }
          : {},
        query.category ? { category: query.category } : {},
        query.source ? { source: query.source } : {},
        typeof query.isActive === "boolean" ? { isActive: query.isActive } : {},
      ],
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.foodItem.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      }),
      this.prisma.foodItem.count({ where }),
    ]);
    return {
      items,
      hasMore: skip + items.length < total,
      nextCursor: skip + items.length < total ? String(query.page + 1) : null,
      total,
    };
  }

  async getAdminCategories() {
    const rows = await this.prisma.foodItem.findMany({
      where: {
        ownerUserId: null,
        category: { not: null },
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows
      .map((row) => row.category)
      .filter((category): category is string => Boolean(category));
  }

  createCatalog(data: Prisma.FoodItemCreateInput) {
    return this.prisma.foodItem.create({ data });
  }

  upsertCatalog(data: Prisma.FoodItemUncheckedCreateInput, nutrients?: Record<string, number>) {
    const name = data.name.trim();
    const brandName =
      typeof data.brandName === "string" && data.brandName.trim()
        ? data.brandName.trim()
        : null;

    return this.prisma.$transaction(async (transaction) => {
      const duplicates = await transaction.foodItem.findMany({
        where: {
          ownerUserId: null,
          name: { equals: name, mode: Prisma.QueryMode.insensitive },
          ...(brandName
            ? {
                brandName: {
                  equals: brandName,
                  mode: Prisma.QueryMode.insensitive,
                },
              }
            : { OR: [{ brandName: null }, { brandName: "" }] }),
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
        select: { id: true },
      });

      const normalizedData = {
        ...data,
        name,
        brandName,
        ownerUserId: null,
        isActive: true,
      };
      
      let foodItem;
      if (duplicates.length === 0) {
        foodItem = await transaction.foodItem.create({ data: normalizedData });
      } else {
        const [canonical, ...redundant] = duplicates;
        foodItem = await transaction.foodItem.update({
          where: { id: canonical.id },
          data: normalizedData,
        });
        if (redundant.length > 0) {
          await transaction.foodItem.updateMany({
            where: { id: { in: redundant.map((item) => item.id) } },
            data: { isActive: false },
          });
        }
      }

      if (nutrients && Object.keys(nutrients).length > 0) {
        // Upsert all nutrients
        for (const [nutrientName, amountPer100g] of Object.entries(nutrients)) {
          let nutrient = await transaction.nutrient.findFirst({
            where: { name: { equals: nutrientName.trim(), mode: Prisma.QueryMode.insensitive } },
          });
          if (!nutrient) {
            nutrient = await transaction.nutrient.create({
              data: {
                name: nutrientName.trim(),
                unit: 'mg',
                category: 'other',
              },
            });
          }
          await transaction.foodNutrient.upsert({
            where: {
              foodItemId_nutrientId: {
                foodItemId: foodItem.id,
                nutrientId: nutrient.id,
              },
            },
            update: { amountPer100g },
            create: {
              foodItemId: foodItem.id,
              nutrientId: nutrient.id,
              amountPer100g,
            },
          });
        }
      }

      return foodItem;
    });
  }

  updateCatalog(id: string, data: Prisma.FoodItemUpdateInput, nutrients?: Record<string, number>) {
    return this.prisma.$transaction(async (transaction) => {
      const foodItem = await transaction.foodItem.update({ where: { id }, data });
      if (nutrients && Object.keys(nutrients).length > 0) {
        for (const [nutrientName, amountPer100g] of Object.entries(nutrients)) {
          let nutrient = await transaction.nutrient.findFirst({
            where: { name: { equals: nutrientName.trim(), mode: Prisma.QueryMode.insensitive } },
          });
          if (!nutrient) {
            nutrient = await transaction.nutrient.create({
              data: {
                name: nutrientName.trim(),
                unit: 'mg',
                category: 'other',
              },
            });
          }
          await transaction.foodNutrient.upsert({
            where: {
              foodItemId_nutrientId: {
                foodItemId: foodItem.id,
                nutrientId: nutrient.id,
              },
            },
            update: { amountPer100g },
            create: {
              foodItemId: foodItem.id,
              nutrientId: nutrient.id,
              amountPer100g,
            },
          });
        }
      }
      return foodItem;
    });
  }
}
