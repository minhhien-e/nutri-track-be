import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MealPlanDefaultScope } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class MealPlanDefaultItemDto {
  @ApiProperty({ example: 'food-id' })
  @IsString()
  foodItemId: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(1)
  grams: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateMealPlanDefaultDto {
  @ApiProperty({ example: 'Thực đơn giảm cân tuần 1' })
  @IsString()
  name: string;

  @ApiProperty({ enum: MealPlanDefaultScope })
  @IsEnum(MealPlanDefaultScope)
  scope: MealPlanDefaultScope;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ example: '2026-06-09T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-07-09T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ example: '2026-06-09' })
  @IsOptional()
  @IsString()
  dateKey?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  weekday?: number;

  @ApiProperty({ type: [MealPlanDefaultItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MealPlanDefaultItemDto)
  items: MealPlanDefaultItemDto[];
}

export class UpdateMealPlanDefaultDto extends PartialType(
  CreateMealPlanDefaultDto,
) {}
