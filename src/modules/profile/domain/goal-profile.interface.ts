import { Goal } from "@prisma/client";
import { BodyProfile } from '@/modules/profile/domain/body-profile';

export interface GoalProfile {
  getGoalType(): Goal;
  calculateCalorieAdjustment(tdee: number, body: BodyProfile, targetWeightKg: number, days: number): number;
  getProteinFactor(): number;
  getFatFactor(): number;
  getCarbFloor(): number;
  getCalorieAdjustmentDirection(): number; // 1: surplus, -1: deficit, 0: none
  getCalorieAdjustmentType(): string; // 'deficit' | 'surplus' | 'maintain'
  getTargetSummaryKey(): string; // 'eat_less_than_burn' | 'eat_more_than_burn' | 'eat_equal_burn'
}
