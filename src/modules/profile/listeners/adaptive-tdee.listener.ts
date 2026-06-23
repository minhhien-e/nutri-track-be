import { Injectable, OnModuleInit } from "@nestjs/common";
import { domainEventEmitter } from '@/common/event-emitter';
import { ProfileService } from '@/modules/profile/profile.service';

@Injectable()
export class AdaptiveTdeeListener implements OnModuleInit {
  constructor(private readonly profileService: ProfileService) {}

  onModuleInit() {
    domainEventEmitter.on("WeightLogChanged", (data: { userId: string }) => {
      // Thực hiện bất đồng bộ thông qua setImmediate hoặc setTimeout để giải phóng call stack chính
      setImmediate(() => {
        this.handleTdeeRefresh(data.userId);
      });
    });

    domainEventEmitter.on("DailyIntakeChanged", (data: { userId: string }) => {
      setImmediate(() => {
        this.handleTdeeRefresh(data.userId);
      });
    });
  }

  private async handleTdeeRefresh(userId: string) {
    try {
      const [profile, target] = await Promise.all([
        this.profileService.getProfile(userId),
        this.profileService.getRawNutritionTarget(userId),
      ]);
      if (profile && target) {
        await this.profileService.refreshAdaptiveTdee(userId, profile, target);
      }
    } catch (error) {
      console.error(`Error refreshing Adaptive TDEE for user ${userId}:`, error);
    }
  }
}
