import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminNutrientsService } from './nutrients.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { NutrientCategory } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('admin-nutrients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/nutrients')
export class AdminNutrientsController {
  constructor(private readonly service: AdminNutrientsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: { name: string; unit: string; category?: NutrientCategory; defaultDailyTarget?: number; description?: string; benefits?: string; foodSources?: string }) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; unit?: string; category?: NutrientCategory; defaultDailyTarget?: number; description?: string; benefits?: string; foodSources?: string }) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
