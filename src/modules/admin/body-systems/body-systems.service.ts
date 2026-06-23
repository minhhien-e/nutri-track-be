import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateBodySystemDto, UpdateBodySystemDto } from './dto/upsert-body-system.dto';

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

  async create(data: CreateBodySystemDto) {
    const { nutrients, ...sysData } = data;
    return this.prisma.$transaction(async (transaction) => {
      const bodySystem = await transaction.bodySystem.create({ data: sysData });
      if (nutrients && Object.keys(nutrients).length > 0) {
        await this.syncNutrients(transaction, bodySystem.id, nutrients);
      }
      return bodySystem;
    });
  }

  async update(id: string, data: UpdateBodySystemDto) {
    const { nutrients, ...sysData } = data;
    return this.prisma.$transaction(async (transaction) => {
      const bodySystem = await transaction.bodySystem.update({
        where: { id },
        data: sysData,
      });
      if (nutrients && Object.keys(nutrients).length > 0) {
        await this.syncNutrients(transaction, id, nutrients);
      }
      return bodySystem;
    });
  }

  private async syncNutrients(transaction: Prisma.TransactionClient, bodySystemId: string, nutrients: Record<string, number>) {
    for (const [nutrientName, impactLevel] of Object.entries(nutrients)) {
      let nutrient = await transaction.nutrient.findFirst({
        where: { name: { equals: nutrientName.trim(), mode: Prisma.QueryMode.insensitive } },
      });
      if (!nutrient) {
        nutrient = await transaction.nutrient.create({
          data: {
            name: nutrientName.trim(),
            unit: 'mg',
            category: 'other',
          },
        });
      }
      await transaction.bodySystemNutrient.upsert({
        where: {
          bodySystemId_nutrientId: {
            bodySystemId,
            nutrientId: nutrient.id,
          },
        },
        update: { impactLevel },
        create: {
          bodySystemId,
          nutrientId: nutrient.id,
          impactLevel,
        },
      });
    }
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
