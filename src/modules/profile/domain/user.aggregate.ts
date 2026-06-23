import { BodyProfile } from '@/modules/profile/domain/body-profile';
import { ActivityProfile } from '@/modules/profile/domain/activity-profile';
import { GoalProfile } from '@/modules/profile/domain/goal-profile.interface';
import { NutritionPlan } from '@/modules/profile/domain/nutrition-plan';
import { NutritionPlanFactory } from '@/modules/profile/domain/nutrition-plan.factory';

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
