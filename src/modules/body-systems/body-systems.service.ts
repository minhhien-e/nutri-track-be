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

  async getDailyStatus(userId: string, dateKey: string) {
    // Lấy record ngày
    const dailyRecord = await this.prisma.dailyRecord.findUnique({
      where: {
        userId_dateKey: {
          userId,
          dateKey,
        },
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

    // Tính tổng lượng vi chất đã ăn trong ngày
    const consumedNutrients: Record<string, number> = {};
    if (dailyRecord) {
      for (const meal of dailyRecord.mealEntries) {
        for (const fn of meal.foodItem.foodNutrients) {
          const amount = (fn.amountPer100g * meal.grams) / 100;
          consumedNutrients[fn.nutrient.name] = (consumedNutrients[fn.nutrient.name] || 0) + amount;
        }
      }
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    const goal = profile?.goal || 'maintainWeight';

    // Đánh giá mức độ hoàn thành cho từng hệ cơ quan
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

    if (recommendations.length === 0) {
      recommendations.push('Bạn đang làm rất tốt! Hãy duy trì chế độ dinh dưỡng này để đạt được mục tiêu nhanh nhất.');
    }

    return {
      dateKey,
      systems,
      recommendations,
    };
  }
}
