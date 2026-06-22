import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUser as CurrentUserType } from '../../common/decorators/current-user.decorator';
import { DateKeyPipe } from '../../common/pipes/date-key.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiaryService } from './diary.service';
import { CreateMealEntryDto } from './dto/create-meal-entry.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { UpdateMealEntryDto } from './dto/update-meal-entry.dto';
import { UpdateWaterDto } from './dto/update-water.dto';

@ApiTags('diary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get(':dateKey')
  getDailyRecord(@CurrentUser() user: CurrentUserType, @Param('dateKey', DateKeyPipe) dateKey: string) {
    return this.diaryService.getDailyRecord(user.id, dateKey);
  }

  @Post(':dateKey/entries')
  addMealEntry(
    @CurrentUser() user: CurrentUserType,
    @Param('dateKey', DateKeyPipe) dateKey: string,
    @Body() dto: CreateMealEntryDto,
  ) {
    return this.diaryService.addMealEntry(user.id, dateKey, dto);
  }

  @Put(':dateKey/entries/:entryId')
  updateMealEntry(
    @CurrentUser() user: CurrentUserType,
    @Param('dateKey', DateKeyPipe) dateKey: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateMealEntryDto,
  ) {
    return this.diaryService.updateMealEntry(user.id, dateKey, entryId, dto);
  }

  @Delete(':dateKey/entries/:entryId')
  deleteMealEntry(
    @CurrentUser() user: CurrentUserType,
    @Param('dateKey', DateKeyPipe) dateKey: string,
    @Param('entryId') entryId: string,
  ) {
    return this.diaryService.deleteMealEntry(user.id, dateKey, entryId);
  }

  @Patch(':dateKey/water')
  updateWater(
    @CurrentUser() user: CurrentUserType,
    @Param('dateKey', DateKeyPipe) dateKey: string,
    @Body() dto: UpdateWaterDto,
  ) {
    return this.diaryService.updateWater(user.id, dateKey, dto.waterMl);
  }

  @Patch(':dateKey/exercise')
  updateExerciseCalories(
    @CurrentUser() user: CurrentUserType,
    @Param('dateKey', DateKeyPipe) dateKey: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.diaryService.updateExerciseCalories(user.id, dateKey, dto.exerciseCalories);
  }
}
