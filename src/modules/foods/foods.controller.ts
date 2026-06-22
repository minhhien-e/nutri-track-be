import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUser as CurrentUserType } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCustomFoodDto } from './dto/create-custom-food.dto';
import { FoodQueryDto } from './dto/food-query.dto';
import { FoodsService } from './foods.service';

@ApiTags('foods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  search(@CurrentUser() user: CurrentUserType, @Query() query: FoodQueryDto) {
    return this.foodsService.search(query, user.id);
  }

  @Get('recent')
  getRecent(@CurrentUser() user: CurrentUserType) {
    return this.foodsService.getRecent(user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.foodsService.getById(id);
  }

  @Post(':foodId/recent')
  markRecent(@CurrentUser() user: CurrentUserType, @Param('foodId') foodId: string) {
    return this.foodsService.markRecent(user.id, foodId);
  }

  @Post('custom')
  createCustom(@CurrentUser() user: CurrentUserType, @Body() dto: CreateCustomFoodDto) {
    return this.foodsService.createCustom(user.id, dto);
  }
}
