import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { BodySystemsService } from './body-systems.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('body-systems')
@Controller('body-systems')
export class BodySystemsController {
  constructor(private readonly bodySystemsService: BodySystemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all body systems and their required nutrients' })
  async findAll() {
    return this.bodySystemsService.findAll();
  }

  @Get('theory')
  @ApiOperation({ summary: 'Get comprehensive body systems theory and nutrient knowledge' })
  async getTheory() {
    return this.bodySystemsService.getTheory();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('status')
  @ApiOperation({ summary: 'Get nutrition coverage status for all body systems for a specific date' })
  @ApiQuery({ name: 'dateKey', required: true, example: '2026-06-22' })
  async getDailyStatus(@Request() req: any, @Query('dateKey') dateKey: string) {
    const userId = req.user.id;
    return this.bodySystemsService.getDailyStatus(userId, dateKey);
  }
}
