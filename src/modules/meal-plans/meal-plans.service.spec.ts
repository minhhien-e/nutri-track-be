import { MealPlanDefaultScope } from '@prisma/client';
import { MealPlansService } from './meal-plans.service';

const dayPlan = {
  id: 'day-plan',
  userId: 'user-1',
  name: 'Ngày cụ thể',
  scope: MealPlanDefaultScope.day,
  enabled: true,
  startDate: new Date('2026-06-01T00:00:00.000Z'),
  endDate: new Date('2026-06-30T00:00:00.000Z'),
  dateKey: '2026-06-09',
  weekday: null,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-02T00:00:00.000Z'),
  items: [
    {
      id: 'item-1',
      mealPlanDefaultId: 'day-plan',
      foodItemId: 'food-1',

      grams: 100,
      sortOrder: 0,
      foodItem: { id: 'food-1' },
    },
  ],
};

describe('MealPlansService', () => {
  const createService = () => {
    const prisma = {
      mealPlanDefault: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const foodsService = { getById: jest.fn() };
    const diaryService = {
      getDailyRecord: jest.fn(),
      addMealEntry: jest.fn(),
    };
    const service = new MealPlansService(
      prisma as never,
      foodsService as never,
      diaryService as never,
    );
    return { service, prisma, foodsService, diaryService };
  };

  it('returns day default before checking weekly default', async () => {
    const { service, prisma } = createService();
    prisma.mealPlanDefault.findFirst.mockResolvedValueOnce(dayPlan);

    await expect(
      service.activeDefault('user-1', '2026-06-09'),
    ).resolves.toEqual(dayPlan);
    expect(prisma.mealPlanDefault.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.mealPlanDefault.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scope: MealPlanDefaultScope.day,
          dateKey: '2026-06-09',
        }),
      }),
    );
  });

  it('falls back to week default when no day default exists', async () => {
    const { service, prisma } = createService();
    const weekPlan = {
      ...dayPlan,
      id: 'week-plan',
      scope: MealPlanDefaultScope.week,
      dateKey: null,
      weekday: 2,
    };
    prisma.mealPlanDefault.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(weekPlan);

    await expect(
      service.activeDefault('user-1', '2026-06-09'),
    ).resolves.toEqual(weekPlan);
    expect(prisma.mealPlanDefault.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scope: MealPlanDefaultScope.week,
          weekday: 2,
        }),
      }),
    );
  });

  it('does not apply default when the day already has entries', async () => {
    const { service, prisma, diaryService } = createService();
    const record = { id: 'record-1', entries: [{ id: 'entry-1' }] };
    diaryService.getDailyRecord.mockResolvedValue(record);

    await expect(service.applyDefault('user-1', '2026-06-09')).resolves.toEqual(
      { applied: false, record },
    );
    expect(prisma.mealPlanDefault.findFirst).not.toHaveBeenCalled();
    expect(diaryService.addMealEntry).not.toHaveBeenCalled();
  });

  it('applies active default to an empty day', async () => {
    const { service, prisma, diaryService } = createService();
    const emptyRecord = { id: 'record-1', entries: [] };
    const updatedRecord = { id: 'record-1', entries: [{ id: 'entry-1' }] };
    diaryService.getDailyRecord.mockResolvedValue(emptyRecord);
    diaryService.addMealEntry.mockResolvedValue(updatedRecord);
    prisma.mealPlanDefault.findFirst.mockResolvedValueOnce(dayPlan);

    await expect(service.applyDefault('user-1', '2026-06-09')).resolves.toEqual(
      { applied: true, mealPlanDefault: dayPlan, record: updatedRecord },
    );
    expect(diaryService.addMealEntry).toHaveBeenCalledWith(
      'user-1',
      '2026-06-09',
      {
        foodItemId: 'food-1',

        grams: 100,
      },
    );
  });
});
