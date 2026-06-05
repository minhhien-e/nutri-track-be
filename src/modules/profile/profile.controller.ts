import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUser as CurrentUserType } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalculateNutritionTargetDto } from './dto/calculate-nutrition-target.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  updateProfile(@CurrentUser() user: CurrentUserType, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Get('nutrition-target')
  getNutritionTarget(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getNutritionTarget(user.id);
  }

  @Get('target-overview')
  getTargetOverview(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getTargetOverview(user.id);
  }

  @Post('calculate-target')
  calculateTarget(@Body() dto: CalculateNutritionTargetDto) {
    return this.profileService.calculateTarget(dto);
  }
}
