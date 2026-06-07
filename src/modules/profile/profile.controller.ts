import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CalculateNutritionTargetDto } from "./dto/calculate-nutrition-target.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpsertWeeklyWeightLogDto } from "./dto/upsert-weekly-weight-log.dto";
import { ProfileService } from "./profile.service";

@ApiTags("profile")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  updateProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Get("nutrition-target")
  getNutritionTarget(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getNutritionTarget(user.id);
  }

  @Get("target-overview")
  getTargetOverview(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getTargetOverview(user.id);
  }

  @Get("target-journey")
  getTargetJourney(@CurrentUser() user: CurrentUserType) {
    return this.profileService.getTargetJourney(user.id);
  }

  @Put("weekly-weight-logs")
  upsertWeeklyWeightLog(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpsertWeeklyWeightLogDto,
  ) {
    return this.profileService.upsertWeeklyWeightLog(user.id, dto);
  }

  @Delete("weekly-weight-logs/:weekKey")
  deleteWeeklyWeightLog(
    @CurrentUser() user: CurrentUserType,
    @Param("weekKey") weekKey: string,
  ) {
    return this.profileService.deleteWeeklyWeightLog(user.id, weekKey);
  }

  @Post("calculate-target")
  calculateTarget(@Body() dto: CalculateNutritionTargetDto) {
    return this.profileService.calculateTarget(dto);
  }
}
