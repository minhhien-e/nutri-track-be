import { Goal } from "@prisma/client";

export interface MacroDistributionStrategy {
  getName(): string;
  calculateMacros(
    targetCalories: number,
    weightKg: number,
    goal: Goal,
  ): {
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}
