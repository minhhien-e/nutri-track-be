import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MealPlanDefaultScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DiaryService } from '../diary/diary.service';
import { FoodsService } from '../foods/foods.service';
import {
  CreateMealPlanDefaultDto,
  UpdateMealPlanDefaultDto,
} from './dto/upsert-meal-plan-default.dto';

const defaultInclude = {
  items: {
    orderBy: { sortOrder: 'asc' as const },
    include: { foodItem: true },
  },
};

@Injectable()
export class MealPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodsService: FoodsService,
    private readonly diaryService: DiaryService,
  ) {}

  listDefaults(userId: string) {
    return this.prisma.mealPlanDefault.findMany({
      where: { userId },
      orderBy: [{ enabled: 'desc' }, { updatedAt: 'desc' }],
      include: defaultInclude,
    });
  }

  async createDefault(userId: string, dto: CreateMealPlanDefaultDto) {
    this.validateDefault(dto);
    await this.ensureFoodsExist(dto.items.map((item) => item.foodItemId));
    const existing = await this.findSameDefault(userId, dto);
    if (existing) return this.updateDefault(userId, existing.id, dto);
    return this.prisma.mealPlanDefault.create({
      data: this.toCreateData(userId, dto),
      include: defaultInclude,
    });
  }

  async updateDefault(
    userId: string,
    id: string,
    dto: UpdateMealPlanDefaultDto,
  ) {
    const current = await this.getOwnedDefault(userId, id);
    const merged = {
      name: dto.name ?? current.name,
      scope: dto.scope ?? current.scope,
      enabled: dto.enabled ?? current.enabled,
      startDate: dto.startDate ?? current.startDate,
      endDate: dto.endDate ?? current.endDate,
      dateKey: dto.dateKey ?? current.dateKey ?? undefined,
      weekday: dto.weekday ?? current.weekday ?? undefined,
      items:
        dto.items ??
        current.items.map((item) => ({
          foodItemId: item.foodItemId,

          grams: item.grams,
          sortOrder: item.sortOrder,
        })),
    };
    this.validateDefault(merged);
    await this.ensureFoodsExist(merged.items.map((item) => item.foodItemId));
    return this.prisma.mealPlanDefault.update({
      where: { id },
      data: {
        name: merged.name,
        scope: merged.scope,
        enabled: merged.enabled,
        startDate: this.startOfDay(merged.startDate),
        endDate: this.startOfDay(merged.endDate),
        dateKey:
          merged.scope === MealPlanDefaultScope.day
            ? merged.dateKey
            : null,
        weekday:
          merged.scope === MealPlanDefaultScope.week
            ? merged.weekday
            : null,
        items: {
          deleteMany: {},
          create: merged.items.map((item, index) => ({
            foodItem: { connect: { id: item.foodItemId } },

            grams: item.grams,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: defaultInclude,
    });
  }

  async setEnabled(userId: string, id: string, enabled: boolean) {
    await this.getOwnedDefault(userId, id);
    return this.prisma.mealPlanDefault.update({
      where: { id },
      data: { enabled },
      include: defaultInclude,
    });
  }

  async deleteDefault(userId: string, id: string) {
    await this.getOwnedDefault(userId, id);
    await this.prisma.mealPlanDefault.delete({ where: { id } });
    return { deleted: true };
  }

  activeDefault(userId: string, dateKey: string) {
    return this.findActiveDefault(userId, dateKey);
  }

  async applyDefault(userId: string, dateKey: string) {
    const record = await this.diaryService.getDailyRecord(userId, dateKey);
    if (record.entries.length > 0) return { applied: false, record };
    const plan = await this.findActiveDefault(userId, dateKey);
    if (!plan) return { applied: false, record };

    let updated = record;
    for (const item of plan.items) {
      updated = await this.diaryService.addMealEntry(userId, dateKey, {
        foodItemId: item.foodItemId,

        grams: item.grams,
      });
    }
    return { applied: true, mealPlanDefault: plan, record: updated };
  }

  private async findActiveDefault(userId: string, dateKey: string) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    const day = await this.prisma.mealPlanDefault.findFirst({
      where: {
        userId,
        enabled: true,
        scope: MealPlanDefaultScope.day,
        dateKey,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      orderBy: { updatedAt: 'desc' },
      include: defaultInclude,
    });
    if (day) return day;

    const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    return this.prisma.mealPlanDefault.findFirst({
      where: {
        userId,
        enabled: true,
        scope: MealPlanDefaultScope.week,
        weekday,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      orderBy: { updatedAt: 'desc' },
      include: defaultInclude,
    });
  }

  private async getOwnedDefault(userId: string, id: string) {
    const plan = await this.prisma.mealPlanDefault.findFirst({
      where: { id, userId },
      include: defaultInclude,
    });
    if (!plan) throw new NotFoundException('Meal plan default not found');
    return plan;
  }

  private findSameDefault(userId: string, dto: CreateMealPlanDefaultDto) {
    return this.prisma.mealPlanDefault.findFirst({
      where: {
        userId,
        scope: dto.scope,
        startDate: this.startOfDay(dto.startDate),
        endDate: this.startOfDay(dto.endDate),
        dateKey:
          dto.scope === MealPlanDefaultScope.day ? dto.dateKey : null,
        weekday:
          dto.scope === MealPlanDefaultScope.week ? dto.weekday : null,
      },
      include: defaultInclude,
    });
  }

  private validateDefault(
    dto: Pick<
      CreateMealPlanDefaultDto,
      'scope' | 'startDate' | 'endDate' | 'dateKey' | 'weekday' | 'items'
    >,
  ) {
    const startDate = this.startOfDay(dto.startDate);
    const endDate = this.startOfDay(dto.endDate);
    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('startDate must be before or equal endDate');
    }
    if (
      dto.scope === MealPlanDefaultScope.day &&
      !this.isValidDateKey(dto.dateKey)
    ) {
      throw new BadRequestException('dateKey is required for day defaults');
    }
    if (
      dto.scope === MealPlanDefaultScope.week &&
      (dto.weekday == null || dto.weekday < 1 || dto.weekday > 7)
    ) {
      throw new BadRequestException('weekday must be 1..7 for week defaults');
    }
    for (const item of dto.items) {
      if (item.grams <= 0) throw new BadRequestException('grams must be > 0');
    }
  }

  private async ensureFoodsExist(foodIds: string[]) {
    const uniqueIds = [...new Set(foodIds)];
    for (const id of uniqueIds) await this.foodsService.getById(id);
  }

  private toCreateData(
    userId: string,
    dto: CreateMealPlanDefaultDto,
  ): Prisma.MealPlanDefaultCreateInput {
    return {
      user: { connect: { id: userId } },
      name: dto.name,
      scope: dto.scope,
      enabled: dto.enabled ?? true,
      startDate: this.startOfDay(dto.startDate),
      endDate: this.startOfDay(dto.endDate),
      dateKey:
        dto.scope === MealPlanDefaultScope.day ? dto.dateKey : null,
      weekday:
        dto.scope === MealPlanDefaultScope.week ? dto.weekday : null,
      items: {
        create: dto.items.map((item, index) => ({
          foodItem: { connect: { id: item.foodItemId } },

          grams: item.grams,
          sortOrder: item.sortOrder ?? index,
        })),
      },
    };
  }

  private startOfDay(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  private isValidDateKey(value: string | undefined) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    );
  }
}
