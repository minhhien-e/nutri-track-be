import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NutrientCategory } from '@prisma/client';

@Injectable()
export class AdminNutrientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.nutrient.findMany({
      orderBy: { category: 'asc' },
    });
  }

  async create(data: {
    name: string;
    unit: string;
    category?: NutrientCategory;
    defaultDailyTarget?: number;
    description?: string;
    benefits?: string;
    foodSources?: string;
  }) {
    return this.prisma.nutrient.create({ data });
  }

  async update(
    id: string,
    data: {
      name?: string;
      unit?: string;
      category?: NutrientCategory;
      defaultDailyTarget?: number;
      description?: string;
      benefits?: string;
      foodSources?: string;
    },
  ) {
    return this.prisma.nutrient.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.nutrient.delete({
      where: { id },
    });
  }
}
