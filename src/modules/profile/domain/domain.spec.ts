import { ActivityLevel, Gender, Goal } from "@prisma/client";
import { BodyProfile } from '@/modules/profile/domain/body-profile';
import { ActivityProfile } from '@/modules/profile/domain/activity-profile';
import { GoalProfileFactory } from '@/modules/profile/domain/goal-profile.strategies';
import { User } from '@/modules/profile/domain/user.aggregate';

describe("Domain Models Unit Tests", () => {
  it("calculates low baseline TDEE and goal macros for weight loss", () => {
    const body = new BodyProfile(Gender.male, 28, 170, 68);
    const activity = new ActivityProfile(ActivityLevel.moderatelyActive);
    const goal = GoalProfileFactory.create(Goal.loseWeight);
    const user = new User(
      "user-1",
      body,
      activity,
      goal,
      new Date(),
      63,
      new Date(Date.now() + 100 * 86_400_000),
    );

    const result = user.generateNutritionPlan();

    expect(result.tdee).toBeCloseTo(1929);
    expect(result.estimatedTdee).toBeCloseTo(1929);
    expect(result.actualTdee).toBeNull();
    expect(result.dailyBaseBurnKcal).toBeCloseTo(1607.5);
    expect(result.dailyActivityBurnKcal).toBeCloseTo(321.5);
    expect(result.dailyEnergyAdjustmentKcal).toBeCloseTo(385);
    expect(result.targetCalories).toBeCloseTo(1544);
    expect(result.proteinG).toBeCloseTo(108.8);
    expect(result.carbsG).toBeCloseTo(185.4);
    expect(result.totalFatG).toBeCloseTo(40.8);
    expect(result.fiberG).toBeCloseTo(21.616, 1);
    expect(result.waterMl).toBe(2040);
    expect(result.saturatedFatLimitG).toBeCloseTo(17.156, 1);
    expect(result.omega3TargetG).toBe(1.6);
    expect(result.transFatLimitG).toBe(0);
    expect(result.macroRatio).toBe("manual_exercise_baseline_v1");
  });

  it("uses goal macros when calories are clamped low", () => {
    const body = new BodyProfile(Gender.female, 40, 150, 45);
    const activity = new ActivityProfile(ActivityLevel.sedentary);
    const goal = GoalProfileFactory.create(Goal.loseWeight);
    const user = new User(
      "user-1",
      body,
      activity,
      goal,
      new Date(),
      35,
      new Date(Date.now() + 365 * 86_400_000),
    );

    const result = user.generateNutritionPlan();

    expect(result.targetCalories).toBe(1200);
    expect(result.proteinG).toBe(72);
    expect(result.carbsG).toBeCloseTo(167.25);
    expect(result.totalFatG).toBeCloseTo(27);
    expect(result.fiberG).toBeCloseTo(16.8);
  });

  it("reduces fat to the floor before letting carbs fall below the goal floor", () => {
    const body = new BodyProfile(Gender.male, 25, 220, 350);
    const activity = new ActivityProfile(ActivityLevel.extraActive);
    const goal = GoalProfileFactory.create(Goal.gainWeight);
    const user = new User(
      "user-1",
      body,
      activity,
      goal,
      new Date(),
      390,
      new Date(Date.now() + 30 * 86_400_000),
    );

    const result = user.generateNutritionPlan();

    expect(result.targetCalories).toBe(5000);
    expect(result.proteinG).toBe(560);
    expect(result.carbsG).toBeCloseTo(180);
    expect(result.totalFatG).toBeCloseTo(226.667);
    expect(result.fiberG).toBeCloseTo(70);
  });

  it("keeps maintenance calories on the low baseline without activity calories", () => {
    const body = new BodyProfile(Gender.male, 30, 170, 70);
    const activity = new ActivityProfile(ActivityLevel.veryActive);
    const goal = GoalProfileFactory.create(Goal.maintainWeight);
    const user = new User(
      "user-1",
      body,
      activity,
      goal,
      new Date(),
      70,
      new Date(Date.now() + 100 * 86_400_000),
    );

    const result = user.generateNutritionPlan();

    expect(result.tdee).toBeCloseTo(1941);
    expect(result.dailyEnergyAdjustmentKcal).toBe(0);
    expect(result.targetCalories).toBeCloseTo(1941);
    expect(result.proteinG).toBeCloseTo(84);
    expect(result.totalFatG).toBeCloseTo(56);
    expect(result.carbsG).toBeCloseTo(275.25);
    expect(result.waterMl).toBe(2100);
  });

  it("uses higher carb floor for weight gain when calories allow it", () => {
    const body = new BodyProfile(Gender.male, 30, 170, 70);
    const activity = new ActivityProfile(ActivityLevel.lightlyActive);
    const goal = GoalProfileFactory.create(Goal.gainWeight);
    const user = new User(
      "user-1",
      body,
      activity,
      goal,
      new Date(),
      72,
      new Date(Date.now() + 100 * 86_400_000),
    );

    const result = user.generateNutritionPlan();

    expect(result.proteinG).toBeCloseTo(112);
    expect(result.totalFatG).toBeCloseTo(56);
    expect(result.carbsG).toBeGreaterThanOrEqual(180);
    expect(result.macroRatio).toBe("manual_exercise_baseline_v1");
  });

  it("does not change TDEE or calories when activity level changes", () => {
    const baseBody = new BodyProfile(Gender.male, 30, 170, 70);
    const goal = GoalProfileFactory.create(Goal.loseWeight);
    
    const userSedentary = new User(
      "user-1",
      baseBody,
      new ActivityProfile(ActivityLevel.sedentary),
      goal,
      new Date(),
      67,
      new Date(Date.now() + 100 * 86_400_000),
    );
    
    const userExtraActive = new User(
      "user-1",
      baseBody,
      new ActivityProfile(ActivityLevel.extraActive),
      goal,
      new Date(),
      67,
      new Date(Date.now() + 100 * 86_400_000),
    );

    const sedentary = userSedentary.generateNutritionPlan();
    const extraActive = userExtraActive.generateNutritionPlan();

    expect(extraActive.estimatedTdee).toBeCloseTo(sedentary.estimatedTdee);
    expect(extraActive.targetCalories).toBeCloseTo(sedentary.targetCalories);
    expect(extraActive.waterMl).toBeCloseTo(sedentary.waterMl);
  });

  it("rejects goal directions that conflict with target weight", () => {
    const body = new BodyProfile(Gender.male, 28, 170, 68);
    const activity = new ActivityProfile(ActivityLevel.moderatelyActive);
    
    expect(() => {
      const user = new User(
        "user-1",
        body,
        activity,
        GoalProfileFactory.create(Goal.loseWeight),
        new Date(),
        70,
        new Date(Date.now() + 100 * 86_400_000),
      );
      user.generateNutritionPlan();
    }).toThrow("Lose weight goal requires target weight lower than current weight");

    expect(() => {
      const user = new User(
        "user-1",
        body,
        activity,
        GoalProfileFactory.create(Goal.gainWeight),
        new Date(),
        65,
        new Date(Date.now() + 100 * 86_400_000),
      );
      user.generateNutritionPlan();
    }).toThrow("Gain weight goal requires target weight higher than current weight");
  });

  describe("Macro Target Strategies Tests", () => {
    const { MacroStrategyFactory } = require("./macro-distribution.strategies");

    it("calculates BalancedMacroStrategy correctly", () => {
      const strategy = MacroStrategyFactory.create("balanced");
      const result = strategy.calculateMacros(2000, 70, Goal.loseWeight);
      expect(result.proteinG).toBe((2000 * 0.3) / 4);
      expect(result.carbsG).toBe((2000 * 0.4) / 4);
      expect(result.fatG).toBe((2000 * 0.3) / 9);
    });
    
    it("calculates LowCarbKetoStrategy correctly", () => {
      const strategy = MacroStrategyFactory.create("low_carb");
      const result = strategy.calculateMacros(2000, 70, Goal.loseWeight);
      expect(result.proteinG).toBe((2000 * 0.2) / 4);
      expect(result.carbsG).toBe((2000 * 0.05) / 4);
      expect(result.fatG).toBe((2000 * 0.75) / 9);
    });

    it("calculates HighProteinStrategy correctly", () => {
      const strategy = MacroStrategyFactory.create("high_protein");
      const result = strategy.calculateMacros(2000, 70, Goal.loseWeight);
      expect(result.proteinG).toBe((2000 * 0.35) / 4);
      expect(result.carbsG).toBe((2000 * 0.45) / 4);
      expect(result.fatG).toBe((2000 * 0.2) / 9);
    });
  });
});
