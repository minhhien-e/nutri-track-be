import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUser as CurrentUserType } from '../../common/decorators/current-user.decorator';
import { DateKeyPipe } from '../../common/pipes/date-key.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('daily/:dateKey')
  getDaily(@CurrentUser() user: CurrentUserType, @Param('dateKey', DateKeyPipe) dateKey: string) {
    return this.analyticsService.getDaily(user.id, dateKey);
  }

  @Get('range')
  getRange(
    @CurrentUser() user: CurrentUserType,
    @Query('from', DateKeyPipe) from: string,
    @Query('to', DateKeyPipe) to: string,
  ) {
    if (new Date(`${from}T00:00:00.000Z`).getTime() > new Date(`${to}T00:00:00.000Z`).getTime()) {
      throw new BadRequestException('from must be before or equal to to');
    }
    return this.analyticsService.getRange(user.id, from, to);
  }
}
