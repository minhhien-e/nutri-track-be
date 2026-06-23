import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '@/common/decorators/current-user.decorator';
import { DateKeyPipe } from '@/common/pipes/date-key.pipe';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UpdateMealPlanEnabledDto } from '@/modules/meal-plans/dto/update-meal-plan-enabled.dto';
import {
  CreateMealPlanDefaultDto,
  UpdateMealPlanDefaultDto,
} from '@/modules/meal-plans/dto/upsert-meal-plan-default.dto';
import { MealPlansService } from '@/modules/meal-plans/meal-plans.service';

@ApiTags('meal-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meal-plans')
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Get('defaults')
  listDefaults(@CurrentUser() user: CurrentUserType) {
    return this.mealPlansService.listDefaults(user.id);
  }

  @Post('defaults')
  createDefault(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateMealPlanDefaultDto,
  ) {
    return this.mealPlansService.createDefault(user.id, dto);
  }

  @Put('defaults/:id')
  updateDefault(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanDefaultDto,
  ) {
    return this.mealPlansService.updateDefault(user.id, id, dto);
  }

  @Patch('defaults/:id/enabled')
  setEnabled(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanEnabledDto,
  ) {
    return this.mealPlansService.setEnabled(user.id, id, dto.enabled);
  }

  @Delete('defaults/:id')
  deleteDefault(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.mealPlansService.deleteDefault(user.id, id);
  }

  @Get('defaults/active/:dateKey')
  activeDefault(
    @CurrentUser() user: CurrentUserType,
    @Param('dateKey', DateKeyPipe) dateKey: string,
  ) {
    return this.mealPlansService.activeDefault(user.id, dateKey);
  }

  @Post('defaults/apply/:dateKey')
  applyDefault(
    @CurrentUser() user: CurrentUserType,
    @Param('dateKey', DateKeyPipe) dateKey: string,
  ) {
    return this.mealPlansService.applyDefault(user.id, dateKey);
  }
}
