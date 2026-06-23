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

  upsertCatalog(data: Prisma.FoodItemUncheckedCreateInput) {
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
      if (duplicates.length === 0) {
        return transaction.foodItem.create({ data: normalizedData });
      }

      const [canonical, ...redundant] = duplicates;
      const updated = await transaction.foodItem.update({
        where: { id: canonical.id },
        data: normalizedData,
      });
      if (redundant.length > 0) {
        await transaction.foodItem.updateMany({
          where: { id: { in: redundant.map((item) => item.id) } },
          data: { isActive: false },
        });
      }
      return updated;
    });
  }

  updateCatalog(id: string, data: Prisma.FoodItemUpdateInput) {
    return this.prisma.foodItem.update({ where: { id }, data });
  }
}
