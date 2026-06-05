import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const includeEntries = {
  mealEntries: {
    orderBy: { createdAt: 'asc' as const },
    include: { foodItem: true },
  },
};

@Injectable()
export class DiaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  getRecord(userId: string, dateKey: string) {
    return this.prisma.dailyRecord.findUnique({
      where: { userId_dateKey: { userId, dateKey } },
      include: includeEntries,
    });
  }

  upsertRecord(userId: string, dateKey: string) {
    return this.prisma.dailyRecord.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      update: {},
      create: { userId, dateKey },
      include: includeEntries,
    });
  }

  async updateWater(userId: string, dateKey: string, waterMl: number) {
    return this.prisma.dailyRecord.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      update: { waterMl },
      create: { userId, dateKey, waterMl },
      include: includeEntries,
    });
  }

  async updateExerciseCalories(userId: string, dateKey: string, exerciseCalories: number) {
    return this.prisma.dailyRecord.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      update: { exerciseCalories },
      create: { userId, dateKey, exerciseCalories },
      include: includeEntries,
    });
  }

  findEntry(entryId: string) {
    return this.prisma.mealEntry.findUnique({ where: { id: entryId } });
  }

  findEntryForUser(entryId: string, userId: string, dateKey: string) {
    return this.prisma.mealEntry.findFirst({
      where: {
        id: entryId,
        dailyRecord: { userId, dateKey },
      },
    });
  }

  createEntry(data: Prisma.MealEntryCreateInput) {
    return this.prisma.mealEntry.create({ data });
  }

  updateEntry(entryId: string, data: Prisma.MealEntryUpdateInput) {
    return this.prisma.mealEntry.update({ where: { id: entryId }, data });
  }

  deleteEntry(entryId: string) {
    return this.prisma.mealEntry.delete({ where: { id: entryId } });
  }
}
