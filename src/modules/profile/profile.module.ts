import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { NutritionTargetService } from './nutrition-target.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, NutritionTargetService],
  exports: [ProfileService, NutritionTargetService],
})
export class ProfileModule {}
