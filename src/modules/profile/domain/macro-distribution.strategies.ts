import { Goal } from "@prisma/client";
import { MacroDistributionStrategy } from "./macro-distribution.interface";
import { NUTRITION_CONFIG } from "../../../config/nutrition.config";

export class LegacyMacroStrategy implements MacroDistributionStrategy {
  private static readonly proteinByGoal: Record<Goal, number> = {
    loseWeight: 1.6,
    maintainWeight: 1.2,
    gainWeight: 1.6,
  };

  private static readonly fatByGoal: Record<Goal, number> = {
    loseWeight: 0.6,
    maintainWeight: 0.8,
    gainWeight: 0.8,
  };

  private static readonly carbFloorByGoal: Record<Goal, number> = {
    loseWeight: 80,
    maintainWeight: 130,
    gainWeight: 180,
  };

  public getName(): string {
    return "legacy";
  }

  public calculateMacros(
    targetCalories: number,
    weightKg: number,
    goal: Goal,
  ): { proteinG: number; carbsG: number; fatG: number } {
    const proteinG = weightKg * LegacyMacroStrategy.proteinByGoal[goal];
    const proteinCalories = proteinG * 4;
    const fatBaseG = weightKg * LegacyMacroStrategy.fatByGoal[goal];
    const fatMinG = weightKg * NUTRITION_CONFIG.fatMinGPerKg;
    const carbFloorG = LegacyMacroStrategy.carbFloorByGoal[goal];

    let totalFatG = fatBaseG;
    let carbsG = (targetCalories - proteinCalories - totalFatG * 9) / 4;

    if (carbsG < carbFloorG) {
      const fatAllowedWithCarbFloor =
        (targetCalories - proteinCalories - carbFloorG * 4) / 9;
      totalFatG = Math.max(fatMinG, Math.min(fatBaseG, fatAllowedWithCarbFloor));
      carbsG = (targetCalories - proteinCalories - totalFatG * 9) / 4;
    }

    return {
      proteinG,
      carbsG: Math.max(0, carbsG),
      fatG: Math.max(0, totalFatG),
    };
  }
}

export class BalancedMacroStrategy implements MacroDistributionStrategy {
  public getName(): string {
    return "balanced";
  }

  public calculateMacros(
    targetCalories: number,
    weightKg: number,
    goal: Goal,
  ): { proteinG: number; carbsG: number; fatG: number } {
    // 30% Protein, 40% Carbs, 30% Fat
    return {
      proteinG: (targetCalories * 0.3) / 4,
      carbsG: (targetCalories * 0.4) / 4,
      fatG: (targetCalories * 0.3) / 9,
    };
  }
}

export class LowCarbKetoStrategy implements MacroDistributionStrategy {
  public getName(): string {
    return "low_carb";
  }

  public calculateMacros(
    targetCalories: number,
    weightKg: number,
    goal: Goal,
  ): { proteinG: number; carbsG: number; fatG: number } {
    // 20% Protein, 5% Carbs, 75% Fat
    return {
      proteinG: (targetCalories * 0.2) / 4,
      carbsG: (targetCalories * 0.05) / 4,
      fatG: (targetCalories * 0.75) / 9,
    };
  }
}

export class HighProteinStrategy implements MacroDistributionStrategy {
  public getName(): string {
    return "high_protein";
  }

  public calculateMacros(
    targetCalories: number,
    weightKg: number,
    goal: Goal,
  ): { proteinG: number; carbsG: number; fatG: number } {
    // 35% Protein, 45% Carbs, 20% Fat
    return {
      proteinG: (targetCalories * 0.35) / 4,
      carbsG: (targetCalories * 0.45) / 4,
      fatG: (targetCalories * 0.2) / 9,
    };
  }
}

export class MacroStrategyFactory {
  public static create(macroRatio: string): MacroDistributionStrategy {
    switch (macroRatio) {
      case "balanced":
        return new BalancedMacroStrategy();
      case "low_carb":
        return new LowCarbKetoStrategy();
      case "high_protein":
        return new HighProteinStrategy();
      case "manual_exercise_baseline_v1":
      default:
        return new LegacyMacroStrategy();
    }
  }
}
