import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomFoodDto } from './dto/create-custom-food.dto';
import { FoodQueryDto } from './dto/food-query.dto';
import { toFoodResponse } from './dto/food-response.dto';
import { FoodsRepository } from './foods.repository';

@Injectable()
export class FoodsService {
  constructor(private readonly foodsRepository: FoodsRepository) {}

  async search(query: FoodQueryDto, userId?: string) {
    const page = await this.foodsRepository.search(query, userId);
    return {
      ...page,
      items: page.items.map(toFoodResponse),
    };
  }

  async getById(id: string) {
    const food = await this.foodsRepository.findById(id);
    if (!food) throw new NotFoundException('Food not found');
    return toFoodResponse(food);
  }

  async getRecent(userId: string) {
    const recent = await this.foodsRepository.getRecent(userId);
    return recent.map((item) => toFoodResponse(item.foodItem));
  }

  async markRecent(userId: string, foodItemId: string) {
    await this.getById(foodItemId);
    const recent = await this.foodsRepository.markRecent(userId, foodItemId);
    return toFoodResponse(recent.foodItem);
  }

  async createCustom(userId: string, dto: CreateCustomFoodDto) {
    const food = await this.foodsRepository.createCustom(userId, dto);
    return toFoodResponse(food);
  }

  async getAnyById(id: string) {
    const food = await this.foodsRepository.findAnyById(id);
    if (!food) throw new NotFoundException('Food not found');
    return food;
  }
}
