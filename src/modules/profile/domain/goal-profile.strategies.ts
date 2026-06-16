import { Goal } from "@prisma/client";
import { BodyProfile } from "./body-profile";
import { GoalProfile } from "./goal-profile.interface";

export class LoseWeightGoal implements GoalProfile {
  public getGoalType(): Goal {
    return Goal.loseWeight;
  }

  public calculateCalorieAdjustment(
    tdee: number,
    body: BodyProfile,
    targetWeightKg: number,
    days: number,
  ): number {
    const rawAdjustment = (Math.abs(body.weightKg - targetWeightKg) * 7700) / days;
    const maxDeficitKcal = 750;
    const maxDeficitRatio = 0.25;
    return Math.min(rawAdjustment, maxDeficitKcal, tdee * maxDeficitRatio);
  }

  public getProteinFactor(): number {
    return 1.6;
  }

  public getFatFactor(): number {
    return 0.6;
  }

  public getCarbFloor(): number {
    return 80;
  }

  public getCalorieAdjustmentDirection(): number {
    return -1;
  }

  public getCalorieAdjustmentType(): string {
    return "deficit";
  }

  public getTargetSummaryKey(): string {
    return "eat_less_than_burn";
  }
}

export class GainWeightGoal implements GoalProfile {
  public getGoalType(): Goal {
    return Goal.gainWeight;
  }

  public calculateCalorieAdjustment(
    tdee: number,
    body: BodyProfile,
    targetWeightKg: number,
    days: number,
  ): number {
    const rawAdjustment = (Math.abs(body.weightKg - targetWeightKg) * 7700) / days;
    const maxSurplusKcal = 500;
    const maxSurplusRatio = 0.15;
    return Math.min(rawAdjustment, maxSurplusKcal, tdee * maxSurplusRatio);
  }

  public getProteinFactor(): number {
    return 1.6;
  }

  public getFatFactor(): number {
    return 0.8;
  }

  public getCarbFloor(): number {
    return 180;
  }

  public getCalorieAdjustmentDirection(): number {
    return 1;
  }

  public getCalorieAdjustmentType(): string {
    return "surplus";
  }

  public getTargetSummaryKey(): string {
    return "eat_more_than_burn";
  }
}

export class MaintainWeightGoal implements GoalProfile {
  public getGoalType(): Goal {
    return Goal.maintainWeight;
  }

  public calculateCalorieAdjustment(
    tdee: number,
    body: BodyProfile,
    targetWeightKg: number,
    days: number,
  ): number {
    return 0;
  }

  public getProteinFactor(): number {
    return 1.2;
  }

  public getFatFactor(): number {
    return 0.8;
  }

  public getCarbFloor(): number {
    return 130;
  }

  public getCalorieAdjustmentDirection(): number {
    return 0;
  }

  public getCalorieAdjustmentType(): string {
    return "maintain";
  }

  public getTargetSummaryKey(): string {
    return "eat_equal_burn";
  }
}

export class GoalProfileFactory {
  public static create(goal: Goal): GoalProfile {
    switch (goal) {
      case Goal.loseWeight:
        return new LoseWeightGoal();
      case Goal.gainWeight:
        return new GainWeightGoal();
      case Goal.maintainWeight:
        return new MaintainWeightGoal();
      default:
        throw new Error(`Unsupported goal: ${goal}`);
    }
  }
}
