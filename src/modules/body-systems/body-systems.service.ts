import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BodySystemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bodySystem.findMany({
      include: {
        nutrients: {
          include: {
            nutrient: true,
          },
        },
      },
    });
  }

  async getTheory() {
    // Return all body systems with their associated nutrients and full descriptions
    return this.findAll();
  }

  async getDailyStatus(userId: string, dateKey: string) {
    // Tạo mảng 7 ngày gần nhất
    const targetDate = new Date(dateKey);
    const dateKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      dateKeys.push(iso);
    }

    // Lấy records của cả tuần
    const weeklyRecords = await this.prisma.dailyRecord.findMany({
      where: {
        userId,
        dateKey: { in: dateKeys },
      },
      include: {
        mealEntries: {
          include: {
            foodItem: {
              include: {
                foodNutrients: {
                  include: {
                    nutrient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const bodySystems = await this.findAll();

    // Lọc ra record của ngày hôm nay
    const dailyRecord = weeklyRecords.find(r => r.dateKey === dateKey);

    // Tính tổng lượng vi chất đã ăn trong ngày hôm nay
    const consumedNutrients: Record<string, number> = {};
    if (dailyRecord) {
      for (const meal of dailyRecord.mealEntries) {
        for (const fn of meal.foodItem.foodNutrients) {
          const amount = (fn.amountPer100g * meal.grams) / 100;
          consumedNutrients[fn.nutrient.name] = (consumedNutrients[fn.nutrient.name] || 0) + amount;
        }
      }
    }

    // Tính tổng lượng vi chất trung bình mỗi ngày trong tuần (chỉ tính trên những ngày có log dữ liệu)
    const trackedDaysCount = Math.max(1, weeklyRecords.length);
    const weeklyConsumed: Record<string, number> = {};
    for (const record of weeklyRecords) {
      for (const meal of record.mealEntries) {
        for (const fn of meal.foodItem.foodNutrients) {
          const amount = (fn.amountPer100g * meal.grams) / 100;
          weeklyConsumed[fn.nutrient.name] = (weeklyConsumed[fn.nutrient.name] || 0) + amount;
        }
      }
    }
    const averageWeeklyConsumed: Record<string, number> = {};
    for (const [key, total] of Object.entries(weeklyConsumed)) {
      averageWeeklyConsumed[key] = total / trackedDaysCount;
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    const goal = profile?.goal || 'maintainWeight';

    // Đánh giá mức độ hoàn thành cho từng hệ cơ quan (vẫn hiển thị theo ngày hiện tại để người dùng có động lực hàng ngày)
    const systems = bodySystems.map((system) => {
      let coverageScore = 0;
      let totalImpact = 0;
      
      const nutrientsStatus = system.nutrients.map((sysNutrient) => {
        const consumed = consumedNutrients[sysNutrient.nutrient.name] || 0;
        const target = sysNutrient.nutrient.defaultDailyTarget || 1; 
        const percentage = Math.min(100, (consumed / target) * 100);
        
        coverageScore += percentage * sysNutrient.impactLevel;
        totalImpact += sysNutrient.impactLevel;
        
        return {
          nutrient: sysNutrient.nutrient.name,
          unit: sysNutrient.nutrient.unit,
          consumed,
          target,
          impactLevel: sysNutrient.impactLevel,
        };
      });

      const overallCoverage = totalImpact > 0 ? (coverageScore / totalImpact) : 0;

      return {
        id: system.id,
        name: system.name,
        description: system.description,
        overallCoverage: Math.round(overallCoverage),
        nutrientsStatus,
      };
    });

    const recommendations: string[] = [];
    const muscleSystem = systems.find(s => s.name === 'Hệ cơ bắp');
    const endocrineSystem = systems.find(s => s.name === 'Hệ nội tiết');
    const skeletalSystem = systems.find(s => s.name === 'Hệ xương khớp');

    if (goal === 'loseWeight') {
      if (muscleSystem && muscleSystem.overallCoverage < 80) {
        recommendations.push('Bạn đang trong quá trình giảm mỡ, hãy tăng cường nạp thêm Protein (đạm) để duy trì khối lượng cơ bắp.');
      }
      if (endocrineSystem && endocrineSystem.overallCoverage < 70) {
        recommendations.push('Hệ nội tiết đang thiếu dưỡng chất. Hãy bổ sung thêm chất béo tốt (Omega-3) để ổn định hormone, giúp quá trình đốt mỡ hiệu quả hơn.');
      }
    } else if (goal === 'gainWeight') {
      if (muscleSystem && muscleSystem.overallCoverage < 90) {
        recommendations.push('Để tăng cơ hiệu quả, bạn cần đạt tối đa mục tiêu hệ cơ bắp hằng ngày. Hãy bổ sung thêm thức ăn giàu đạm.');
      }
      if (skeletalSystem && skeletalSystem.overallCoverage < 80) {
        recommendations.push('Xương khớp chắc khỏe là nền tảng để tập luyện nặng và tăng cơ. Hãy chú ý nạp đủ Canxi và Vitamin D.');
      }
    }

    // THUẬT TOÁN ĂN BÙ (COMPENSATION) THEO TUẦN
    const trackedNutrientsForCompensation = [
      { name: 'Canxi', system: 'Hệ xương khớp', sources: 'sữa, tôm, cua, cá nhỏ nguyên xương' },
      { name: 'Magie', system: 'Hệ cơ bắp', sources: 'các loại hạt (hạnh nhân, óc chó), rau bina' },
      { name: 'Kali', system: 'Hệ cơ bắp', sources: 'chuối, khoai lang, bơ' },
      { name: 'Vitamin D', system: 'Hệ xương khớp', sources: 'cá hồi, lòng đỏ trứng hoặc tắm nắng' },
      { name: 'Vitamin C', system: 'Hệ miễn dịch', sources: 'cam, chanh, ổi, ớt chuông' },
      { name: 'Omega-3', system: 'Hệ nội tiết', sources: 'cá biển, hạt chia' },
    ];

    let hasCompensation = false;
    for (const item of trackedNutrientsForCompensation) {
      // Tìm xem có trong data base không để lấy target
      let target = 1;
      for (const sys of bodySystems) {
        const sysNut = sys.nutrients.find(n => n.nutrient.name === item.name);
        if (sysNut) {
          target = sysNut.nutrient.defaultDailyTarget || 1;
          break;
        }
      }

      const avgConsumed = averageWeeklyConsumed[item.name] || 0;
      const weeklyPercentage = (avgConsumed / target) * 100;

      if (weeklyPercentage < 60) {
        recommendations.push(`⚠️ Cảnh báo Ăn Bù: Trong 7 ngày qua, lượng ${item.name} trung bình của bạn chỉ đạt ${Math.round(weeklyPercentage)}%. Hãy ưu tiên ăn bù thêm ${item.sources} để bảo vệ ${item.system}.`);
        hasCompensation = true;
      }
    }

    if (recommendations.length === 0 && !hasCompensation) {
      recommendations.push('Bạn đang làm rất tốt cả về lượng ăn hàng ngày và duy trì sự cân bằng trong tuần! Hãy tiếp tục phát huy nhé.');
    }

    return {
      dateKey,
      systems,
      recommendations,
    };
  }
}
