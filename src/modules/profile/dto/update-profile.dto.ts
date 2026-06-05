import { ApiProperty } from '@nestjs/swagger';
import { ActivityLevel, Gender, Goal } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 28 })
  @IsInt()
  @Min(1)
  @Max(120)
  age: number;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: 170 })
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm: number;

  @ApiProperty({ example: 68 })
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg: number;

  @ApiProperty({ example: 63 })
  @IsNumber()
  @Min(20)
  @Max(400)
  targetWeightKg: number;

  @ApiProperty({ example: '2026-09-12T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  targetDate: Date;

  @ApiProperty({ enum: ActivityLevel })
  @IsEnum(ActivityLevel)
  activityLevel: ActivityLevel;

  @ApiProperty({ enum: Goal })
  @IsEnum(Goal)
  goal: Goal;
}
