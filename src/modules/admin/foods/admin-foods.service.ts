import { Injectable } from "@nestjs/common";
import { FoodSource, Prisma } from "@prisma/client";
import { FoodsRepository } from '@/modules/foods/foods.repository';
import { FoodsService } from '@/modules/foods/foods.service';
import { AdminFoodQueryDto } from '@/modules/admin/foods/dto/admin-food-query.dto';
import {
  CreateAdminFoodDto,
  UpdateAdminFoodDto,
} from '@/modules/admin/foods/dto/upsert-admin-food.dto';

@Injectable()
export class AdminFoodsService {
  constructor(
    private readonly foodsRepository: FoodsRepository,
    private readonly foodsService: FoodsService,
  ) {}

  search(query: AdminFoodQueryDto) {
    return this.foodsRepository.adminSearch(query);
  }

  getCategories() {
    return this.foodsRepository.getAdminCategories();
  }

  getById(id: string) {
    return this.foodsService.getAnyById(id);
  }

  create(dto: CreateAdminFoodDto) {
    return this.foodsRepository.upsertCatalog({
      ...this.toCreateData(dto),
      source: dto.source ?? FoodSource.adminCatalog,
      isActive: true,
    }, dto.nutrients);
  }

  async update(id: string, dto: UpdateAdminFoodDto) {
    await this.foodsService.getAnyById(id);
    return this.foodsRepository.updateCatalog(id, this.toUpdateData(dto), dto.nutrients);
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.foodsService.getAnyById(id);
    return this.foodsRepository.updateCatalog(id, { isActive });
  }

  softDelete(id: string) {
    return this.updateStatus(id, false);
  }

  private toCreateData(
    dto: CreateAdminFoodDto,
  ): Prisma.FoodItemUncheckedCreateInput {
    return {
      name: dto.name,
      brandName: dto.brandName,
      servingSizeG: dto.servingSizeG,
      caloriesPer100g: dto.caloriesPer100g,
      proteinPer100g: dto.proteinPer100g,
      carbsPer100g: dto.carbsPer100g,
      fatPer100g: dto.totalFatPer100g,
      totalFatPer100g: dto.totalFatPer100g,
      saturatedFatPer100g: dto.saturatedFatPer100g ?? 0,
      omega3Per100g: dto.omega3Per100g ?? 0,
      transFatPer100g: dto.transFatPer100g ?? 0,
      fiberPer100g: dto.fiberPer100g ?? 0,
      source: dto.source ?? FoodSource.adminCatalog,
      imageAssetPath: dto.imageAssetPath,
      category: dto.category,
      displayTag: dto.displayTag,
      ownerUserId: null,
    };
  }

  private toUpdateData(
    dto: UpdateAdminFoodDto,
  ): Prisma.FoodItemUncheckedUpdateInput {
    const data: Prisma.FoodItemUncheckedUpdateInput = {
      ...dto,
      ownerUserId: null,
    };
    if (dto.totalFatPer100g !== undefined) {
      data.fatPer100g = dto.totalFatPer100g;
      data.totalFatPer100g = dto.totalFatPer100g;
    }
    return data;
  }
}
