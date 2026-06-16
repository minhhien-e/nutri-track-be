import { ActivityLevel } from "@prisma/client";
import { NUTRITION_CONFIG } from "../../../config/nutrition.config";

export class ActivityProfile {
  constructor(public readonly activityLevel: ActivityLevel) {}

  public calculateActivityFactor(): number {
    return NUTRITION_CONFIG.baselineActivityFactor;
  }
}
