import { ActivityLevel, Gender, Goal } from "@prisma/client";
import { NutritionTargetService } from "./nutrition-target.service";
import { ProfileService } from "./profile.service";

describe("ProfileService target overview calories", () => {
  const profile = {
    id: "profile-1",
    userId: "user-1",
    age: 30,
    gender: Gender.male,
    heightCm: 170,
    weightKg: 70,
    activityLevel: ActivityLevel.lightlyActive,
    goal: Goal.loseWeight,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const nutritionTarget = {
    id: "target-1",
    userId: "user-1",
    startWeightKg: 72,
    targetWeightKg: 68,
    targetDate: new Date(Date.now() + 10 * 86_400_000),
    bmr: 1600,
    tdee: 2400,
    dailyBaseBurnKcal: 1600,
    dailyActivityBurnKcal: 800,
    dailyTotalBurnKcal: 2400,
    dailyEnergyAdjustmentKcal: 400,
    targetCalories: 2000,
    proteinG: 150,
    carbsG: 200,
    fatG: 66,
    totalFatG: 66,
    fiberG: 25,
    waterMl: 2100,
    saturatedFatLimitG: 22,
    omega3TargetG: 1.6,
    transFatLimitG: 0,
    macroRatio: "30/40/30",
    calculatedAt: new Date(),
  };

  function createService(
    record: unknown,
    overrides: { goal?: Goal; target?: Partial<typeof nutritionTarget> } = {},
  ) {
    const prisma = {
      userProfile: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            ...profile,
            goal: overrides.goal ?? profile.goal,
          }),
      },
      nutritionTarget: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ ...nutritionTarget, ...overrides.target }),
      },
      dailyRecord: {
        findUnique: jest.fn().mockResolvedValue(record),
      },
    };
    return new ProfileService(prisma as never, {} as never);
  }

  it("returns remaining food calories when consumed is below target", async () => {
    const service = createService({
      waterMl: 1000,
      exerciseCalories: 0,
      mealEntries: [
        {
          calories: 178,
          proteinG: 10,
          carbsG: 20,
          totalFatG: 5,
          fatG: 5,
          saturatedFatG: 1,
          omega3G: 0,
          transFatG: 0,
          fiberG: 2,
        },
      ],
    });

    const result = await service.getTargetOverview("user-1");

    expect(result?.today.consumedCalories).toBe(178);
    expect(result?.today.baseRemainingFoodCalories).toBe(1822);
    expect(result?.today.exerciseCreditCalories).toBe(0);
    expect(result?.today.remainingFoodCalories).toBe(1822);
    expect(result?.today.exerciseCaloriesToBurn).toBe(0);
  });

  it("uses exercise credit when calculating remaining food calories", async () => {
    const service = createService({
      waterMl: 1000,
      exerciseCalories: 600,
      mealEntries: [
        {
          calories: 178,
          proteinG: 10,
          carbsG: 20,
          totalFatG: 5,
          fatG: 5,
          saturatedFatG: 1,
          omega3G: 0,
          transFatG: 0,
          fiberG: 2,
        },
      ],
    });

    const result = await service.getTargetOverview("user-1");

    expect(result?.today.baseRemainingFoodCalories).toBe(1822);
    expect(result?.today.exerciseCreditCalories).toBe(600);
    expect(result?.today.remainingFoodCalories).toBe(2422);
  });

  it("returns exercise burn needed after applying exercise credit", async () => {
    const service = createService({
      waterMl: 1000,
      exerciseCalories: 100,
      mealEntries: [
        {
          calories: 2300,
          proteinG: 10,
          carbsG: 20,
          totalFatG: 5,
          fatG: 5,
          saturatedFatG: 1,
          omega3G: 0,
          transFatG: 0,
          fiberG: 2,
        },
      ],
    });

    const result = await service.getTargetOverview("user-1");

    expect(result?.today.overTargetCalories).toBe(200);
    expect(result?.today.exerciseCaloriesToBurn).toBe(200);
    expect(result?.today.projectedNetCalories).toBe(2200);
  });

  it("keeps projected net calories signed and exposes a clamped value", async () => {
    const service = createService({
      waterMl: 1000,
      exerciseCalories: 600,
      mealEntries: [
        {
          calories: 178,
          proteinG: 10,
          carbsG: 20,
          totalFatG: 5,
          fatG: 5,
          saturatedFatG: 1,
          omega3G: 0,
          transFatG: 0,
          fiberG: 2,
        },
      ],
    });

    const result = await service.getTargetOverview("user-1");

    expect(result?.today.loggedExerciseCalories).toBe(600);
    expect(result?.today.projectedNetCalories).toBe(-422);
    expect(result?.today.netCalories).toBe(-422);
    expect(result?.today.clampedNetCalories).toBe(0);
  });

  it("explains lose weight calorie plan as eating below daily burn", async () => {
    const service = createService({
      waterMl: 1000,
      exerciseCalories: 0,
      mealEntries: [],
    });

    const result = await service.getTargetOverview("user-1");

    expect(result?.caloriePlan.goalMode).toBe(Goal.loseWeight);
    expect(result?.caloriePlan.dailyIntakeTargetKcal).toBe(2000);
    expect(result?.caloriePlan.dailyBurnKcal).toBe(2400);
    expect(result?.caloriePlan.dailyAdjustmentKcal).toBe(400);
    expect(result?.caloriePlan.targetSummaryKey).toBe("eat_less_than_burn");
  });

  it("explains maintain weight calorie plan as eating equal to daily burn", async () => {
    const service = createService(
      { waterMl: 1000, exerciseCalories: 0, mealEntries: [] },
      {
        goal: Goal.maintainWeight,
        target: {
          dailyEnergyAdjustmentKcal: 0,
          targetCalories: 2400,
        },
      },
    );

    const result = await service.getTargetOverview("user-1");

    expect(result?.caloriePlan.goalMode).toBe(Goal.maintainWeight);
    expect(result?.caloriePlan.dailyIntakeTargetKcal).toBe(2400);
    expect(result?.caloriePlan.dailyBurnKcal).toBe(2400);
    expect(result?.caloriePlan.dailyAdjustmentKcal).toBe(0);
    expect(result?.caloriePlan.targetSummaryKey).toBe("eat_equal_burn");
  });

  it("explains gain weight calorie plan as eating above daily burn", async () => {
    const service = createService(
      { waterMl: 1000, exerciseCalories: 0, mealEntries: [] },
      {
        goal: Goal.gainWeight,
        target: {
          targetCalories: 2800,
          dailyEnergyAdjustmentKcal: 400,
        },
      },
    );

    const result = await service.getTargetOverview("user-1");

    expect(result?.caloriePlan.goalMode).toBe(Goal.gainWeight);
    expect(result?.caloriePlan.dailyIntakeTargetKcal).toBe(2800);
    expect(result?.caloriePlan.dailyBurnKcal).toBe(2400);
    expect(result?.caloriePlan.dailyAdjustmentKcal).toBe(400);
    expect(result?.caloriePlan.targetSummaryKey).toBe("eat_more_than_burn");
  });

  it("recalculates stored legacy nutrition targets when requested", async () => {
    const targetDate = new Date(Date.now() + 100 * 86_400_000);
    const legacyTarget = {
      ...nutritionTarget,
      targetWeightKg: 68,
      targetDate,
      macroRatio: "30/40/30",
    };
    const prisma = {
      userProfile: {
        findUnique: jest.fn().mockResolvedValue(profile),
      },
      nutritionTarget: {
        findUnique: jest.fn().mockResolvedValue(legacyTarget),
        upsert: jest.fn(({ update }) =>
          Promise.resolve({ ...legacyTarget, ...update }),
        ),
      },
    };
    const service = new ProfileService(
      prisma as never,
      new NutritionTargetService(),
    );

    const result = await service.getNutritionTarget("user-1");

    expect(result?.macroRatio).toBe("goal_activity_v1");
    expect(result?.proteinG).toBeCloseTo(119);
    expect(result?.totalFatG).toBeCloseTo(42);
    expect(prisma.nutritionTarget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        update: expect.objectContaining({ macroRatio: "goal_activity_v1" }),
      }),
    );
  });
});
