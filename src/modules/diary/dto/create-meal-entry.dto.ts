import { ApiProperty } from '@nestjs/swagger';
import { MealType } from '@prisma/client';
import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export class CreateMealEntryDto {
  @ApiProperty({ example: 'chicken-breast' })
  @IsString()
  foodItemId: string;

  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(1)
  grams: number;
}
