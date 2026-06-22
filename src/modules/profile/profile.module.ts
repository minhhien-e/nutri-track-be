import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { NutritionTargetService } from './nutrition-target.service';
import { AdaptiveTdeeListener } from './listeners/adaptive-tdee.listener';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, NutritionTargetService, AdaptiveTdeeListener],
  exports: [ProfileService, NutritionTargetService],
})
export class ProfileModule {}
