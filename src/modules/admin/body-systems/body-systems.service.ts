import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class AdminBodySystemsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bodySystem.findMany({
      include: {
        nutrients: {
          include: {
            nutrient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; description?: string }) {
    return this.prisma.bodySystem.create({ data });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    return this.prisma.bodySystem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.bodySystem.delete({
      where: { id },
    });
  }

  async linkNutrient(bodySystemId: string, nutrientId: string, impactLevel: number) {
    return this.prisma.bodySystemNutrient.upsert({
      where: {
        bodySystemId_nutrientId: {
          bodySystemId,
          nutrientId,
        },
      },
      update: { impactLevel },
      create: {
        bodySystemId,
        nutrientId,
        impactLevel,
      },
    });
  }

  async unlinkNutrient(bodySystemId: string, nutrientId: string) {
    return this.prisma.bodySystemNutrient.delete({
      where: {
        bodySystemId_nutrientId: {
          bodySystemId,
          nutrientId,
        },
      },
    });
  }
}
