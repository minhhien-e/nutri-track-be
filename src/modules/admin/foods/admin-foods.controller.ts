import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AdminFoodsService } from './admin-foods.service';
import { AdminFoodQueryDto } from './dto/admin-food-query.dto';
import { UpdateFoodStatusDto } from './dto/update-food-status.dto';
import { CreateAdminFoodDto, UpdateAdminFoodDto } from './dto/upsert-admin-food.dto';

@ApiTags('admin-foods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/foods')
export class AdminFoodsController {
  constructor(private readonly adminFoodsService: AdminFoodsService) {}

  @Get()
  search(@Query() query: AdminFoodQueryDto) {
    return this.adminFoodsService.search(query);
  }

  @Get('categories')
  categories() {
    return this.adminFoodsService.getCategories();
  }

  @Post()
  create(@Body() dto: CreateAdminFoodDto) {
    return this.adminFoodsService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.adminFoodsService.getById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminFoodDto) {
    return this.adminFoodsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFoodStatusDto) {
    return this.adminFoodsService.updateStatus(id, dto.isActive);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.adminFoodsService.softDelete(id);
  }
}
