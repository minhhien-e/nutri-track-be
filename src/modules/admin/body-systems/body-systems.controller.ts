import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminBodySystemsService } from './body-systems.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('admin-body-systems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/body-systems')
export class AdminBodySystemsController {
  constructor(private readonly service: AdminBodySystemsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: { name: string; description?: string }) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; description?: string }) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/nutrients')
  linkNutrient(
    @Param('id') id: string,
    @Body() data: { nutrientId: string; impactLevel: number },
  ) {
    return this.service.linkNutrient(id, data.nutrientId, data.impactLevel);
  }

  @Delete(':id/nutrients/:nutrientId')
  unlinkNutrient(@Param('id') id: string, @Param('nutrientId') nutrientId: string) {
    return this.service.unlinkNutrient(id, nutrientId);
  }
}
