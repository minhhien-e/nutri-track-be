import { ActivityLevel } from "@prisma/client";

export class ActivityProfile {
  constructor(public readonly activityLevel: ActivityLevel) {}

  public calculateActivityFactor(): number {
    // Để giữ tương thích hoàn toàn với logic hiện tại (baseline_v1)
    // Tạm thời trả về 1.2 cho mọi mức độ. Có thể cấu hình mở rộng trong tương lai.
    return 1.2;
  }
}
