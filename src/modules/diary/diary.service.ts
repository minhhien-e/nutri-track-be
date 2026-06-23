import { Injectable, NotFoundException } from '@nestjs/common';
import { FoodsService } from '@/modules/foods/foods.service';
import { CreateMealEntryDto } from '@/modules/diary/dto/create-meal-entry.dto';
import { UpdateMealEntryDto } from '@/modules/diary/dto/update-meal-entry.dto';
import { DiaryRepository } from '@/modules/diary/diary.repository';
import { DiaryTotalsService } from '@/modules/diary/diary-totals.service';
import { FoodItem } from '@/modules/foods/domain/food-item';
import { MealEntry } from '@/modules/diary/domain/meal-entry';
import { DailyRecord } from '@/modules/diary/domain/daily-record';
import { domainEventEmitter } from '@/common/event-emitter';

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

      grams: dto.grams,
      ...nutrients,
    });
    await this.foodsService.markRecent(userId, food.id);
    domainEventEmitter.emit('DailyIntakeChanged', { userId });
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

      grams,
      ...nutrients,
    });
    domainEventEmitter.emit('DailyIntakeChanged', { userId });
    return this.getDailyRecord(userId, dateKey);
  }

  async deleteMealEntry(userId: string, dateKey: string, entryId: string) {
    const entry = await this.diaryRepository.findEntryForUser(entryId, userId, dateKey);
    if (!entry) throw new NotFoundException('Meal entry not found');
    await this.diaryRepository.deleteEntry(entryId);
    domainEventEmitter.emit('DailyIntakeChanged', { userId });
    return { deleted: true, record: await this.getDailyRecord(userId, dateKey) };
  }

  async updateWater(userId: string, dateKey: string, waterMl: number) {
    const record = await this.diaryRepository.updateWater(userId, dateKey, waterMl);
    return this.withTotals(record);
  }

  async updateExerciseCalories(userId: string, dateKey: string, exerciseCalories: number) {
    const record = await this.diaryRepository.updateExerciseCalories(userId, dateKey, exerciseCalories);
    domainEventEmitter.emit('DailyIntakeChanged', { userId });
    return this.withTotals(record);
  }

  private withTotals(record: Awaited<ReturnType<DiaryRepository['upsertRecord']>>) {
    const domainEntries = record.mealEntries.map(entry => {
      const domainFood = new FoodItem(entry.foodItem);
      return new MealEntry({
        id: entry.id,
        foodItem: domainFood,
        foodItemId: entry.foodItemId,
        grams: entry.grams,
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        totalFatG: entry.totalFatG,
        saturatedFatG: entry.saturatedFatG,
        omega3G: entry.omega3G,
        transFatG: entry.transFatG,
        fiberG: entry.fiberG,
      });
    });

    const dailyRecord = new DailyRecord({
      id: record.id,
      userId: record.userId,
      dateKey: record.dateKey,
      waterMl: record.waterMl,
      exerciseCalories: record.exerciseCalories,
      entries: domainEntries,
    });

    const totals = dailyRecord.getTotalNutrients();

    return {
      id: record.id,
      userId: record.userId,
      dateKey: record.dateKey,
      waterMl: record.waterMl,
      exerciseCalories: record.exerciseCalories,
      entries: record.mealEntries,
      totalCalories: totals.calories,
      netCalories: dailyRecord.getNetCalories(),
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
