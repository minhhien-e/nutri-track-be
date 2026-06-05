import { Injectable, NotFoundException } from '@nestjs/common';
import { FoodsService } from '../foods/foods.service';
import { CreateMealEntryDto } from './dto/create-meal-entry.dto';
import { UpdateMealEntryDto } from './dto/update-meal-entry.dto';
import { DiaryRepository } from './diary.repository';
import { DiaryTotalsService } from './diary-totals.service';

@Injectable()
export class DiaryService {
  constructor(
    private readonly diaryRepository: DiaryRepository,
    private readonly foodsService: FoodsService,
    private readonly diaryTotalsService: DiaryTotalsService,
  ) {}

  async getDailyRecord(userId: string, dateKey: string) {
    const record = await this.diaryRepository.upsertRecord(userId, dateKey);
    return this.withTotals(record);
  }

  async addMealEntry(userId: string, dateKey: string, dto: CreateMealEntryDto) {
    const record = await this.diaryRepository.upsertRecord(userId, dateKey);
    const food = await this.foodsService.getById(dto.foodItemId);
    const nutrients = this.diaryTotalsService.scaleFood(food, dto.grams);
    await this.diaryRepository.createEntry({
      dailyRecord: { connect: { id: record.id } },
      foodItem: { connect: { id: food.id } },
      mealType: dto.mealType,
      grams: dto.grams,
      ...nutrients,
    });
    await this.foodsService.markRecent(userId, food.id);
    return this.getDailyRecord(userId, dateKey);
  }

  async updateMealEntry(userId: string, dateKey: string, entryId: string, dto: UpdateMealEntryDto) {
    const entry = await this.diaryRepository.findEntryForUser(entryId, userId, dateKey);
    if (!entry) throw new NotFoundException('Meal entry not found');
    const food = dto.foodItemId ? await this.foodsService.getById(dto.foodItemId) : await this.foodsService.getById(entry.foodItemId);
    const grams = dto.grams ?? entry.grams;
    const nutrients = this.diaryTotalsService.scaleFood(food, grams);
    await this.diaryRepository.updateEntry(entryId, {
      foodItem: { connect: { id: food.id } },
      mealType: dto.mealType ?? entry.mealType,
      grams,
      ...nutrients,
    });
    return this.getDailyRecord(userId, dateKey);
  }

  async deleteMealEntry(userId: string, dateKey: string, entryId: string) {
    const entry = await this.diaryRepository.findEntryForUser(entryId, userId, dateKey);
    if (!entry) throw new NotFoundException('Meal entry not found');
    await this.diaryRepository.deleteEntry(entryId);
    return { deleted: true, record: await this.getDailyRecord(userId, dateKey) };
  }

  async updateWater(userId: string, dateKey: string, waterMl: number) {
    const record = await this.diaryRepository.updateWater(userId, dateKey, waterMl);
    return this.withTotals(record);
  }

  async updateExerciseCalories(userId: string, dateKey: string, exerciseCalories: number) {
    const record = await this.diaryRepository.updateExerciseCalories(userId, dateKey, exerciseCalories);
    return this.withTotals(record);
  }

  private withTotals(record: Awaited<ReturnType<DiaryRepository['upsertRecord']>>) {
    const totals = this.diaryTotalsService.totals(record.mealEntries);
    return {
      id: record.id,
      userId: record.userId,
      dateKey: record.dateKey,
      waterMl: record.waterMl,
      exerciseCalories: record.exerciseCalories,
      entries: record.mealEntries,
      totalCalories: totals.calories,
      netCalories: totals.calories - record.exerciseCalories,
      totalProteinG: totals.proteinG,
      totalCarbsG: totals.carbsG,
      totalFatG: totals.totalFatG,
      totalSaturatedFatG: totals.saturatedFatG,
      totalOmega3G: totals.omega3G,
      totalTransFatG: totals.transFatG,
      totalFiberG: totals.fiberG,
      updatedAt: record.updatedAt,
    };
  }
}
