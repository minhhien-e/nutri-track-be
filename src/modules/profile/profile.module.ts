import { Module } from '@nestjs/common';
import { ProfileController } from '@/modules/profile/profile.controller';
import { ProfileService } from '@/modules/profile/profile.service';
import { NutritionTargetService } from '@/modules/profile/nutrition-target.service';
import { AdaptiveTdeeListener } from '@/modules/profile/listeners/adaptive-tdee.listener';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, NutritionTargetService, AdaptiveTdeeListener],
  exports: [ProfileService, NutritionTargetService],
})
export class ProfileModule {}
