import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityLevel, Gender, Goal } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

const KCAL_PER_KG = 7700;
const MIN_TARGET_CALORIES = 1200;
const MAX_TARGET_CALORIES = 5000;

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
};

@Injectable()
export class NutritionTargetService {
  calculate(profile: UpdateProfileDto) {
    this.validateGoalDirection(profile);
    const genderOffset = profile.gender === Gender.male ? 5 : -161;
    const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + genderOffset;
    const dailyBaseBurnKcal = bmr;
    const dailyActivityBurnKcal = bmr * (activityFactors[profile.activityLevel] - 1);
    const dailyTotalBurnKcal = dailyBaseBurnKcal + dailyActivityBurnKcal;
    const tdee = dailyTotalBurnKcal;
    const days = Math.max(1, Math.ceil((profile.targetDate.getTime() - Date.now()) / 86_400_000));
    const dailyEnergyAdjustmentKcal =
      profile.goal === Goal.maintainWeight ? 0 : (Math.abs(profile.weightKg - profile.targetWeightKg) * KCAL_PER_KG) / days;
    const rawTargetCalories =
      profile.goal === Goal.loseWeight
        ? dailyTotalBurnKcal - dailyEnergyAdjustmentKcal
        : profile.goal === Goal.gainWeight
          ? dailyTotalBurnKcal + dailyEnergyAdjustmentKcal
          : dailyTotalBurnKcal;
    const targetCalories = Math.min(MAX_TARGET_CALORIES, Math.max(MIN_TARGET_CALORIES, rawTargetCalories));
    const totalFatG = (targetCalories * 0.3) / 9;
    return {
      startWeightKg: profile.weightKg,
      targetWeightKg: profile.targetWeightKg,
      targetDate: profile.targetDate,
      bmr,
      tdee,
      dailyBaseBurnKcal,
      dailyActivityBurnKcal,
      dailyTotalBurnKcal,
      dailyEnergyAdjustmentKcal,
      targetCalories,
      proteinG: (targetCalories * 0.3) / 4,
      carbsG: (targetCalories * 0.4) / 4,
      fatG: totalFatG,
      totalFatG,
      fiberG: 25,
      waterMl: profile.weightKg * 35,
      saturatedFatLimitG: (targetCalories * 0.1) / 9,
      omega3TargetG: profile.gender === Gender.male ? 1.6 : 1.1,
      transFatLimitG: 0,
      macroRatio: '30/40/30',
      calculatedAt: new Date(),
    };
  }

  private validateGoalDirection(profile: UpdateProfileDto) {
    const targetTime = profile.targetDate.getTime();
    if (profile.goal !== Goal.maintainWeight && targetTime <= Date.now()) {
      throw new BadRequestException('Target date must be in the future');
    }
    if (profile.goal === Goal.loseWeight && profile.targetWeightKg >= profile.weightKg) {
      throw new BadRequestException('Lose weight goal requires target weight lower than current weight');
    }
    if (profile.goal === Goal.gainWeight && profile.targetWeightKg <= profile.weightKg) {
      throw new BadRequestException('Gain weight goal requires target weight higher than current weight');
    }
  }
}
