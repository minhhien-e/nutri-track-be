import { BodyProfile } from "./body-profile";
import { ActivityProfile } from "./activity-profile";
import { GoalProfile } from "./goal-profile.interface";
import { NutritionPlan } from "./nutrition-plan";
import { NutritionPlanFactory } from "./nutrition-plan.factory";

export class User {
  constructor(
    public readonly id: string,
    public readonly bodyProfile: BodyProfile,
    public readonly activityProfile: ActivityProfile,
    public readonly goalProfile: GoalProfile,
    public readonly startDate: Date,
    public readonly targetWeightKg: number,
    public readonly targetDate: Date,
    public readonly macroRatio: string = "manual_exercise_baseline_v1",
  ) {}

  public generateNutritionPlan(actualTdee?: number | null): NutritionPlan {
    return NutritionPlanFactory.createPlan(this, actualTdee);
  }
}
