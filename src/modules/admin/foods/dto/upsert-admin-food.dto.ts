import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FoodSource } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAdminFoodDto {
  @ApiProperty({ example: 'Cơm gạo lứt ức gà' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({ example: 320 })
  @IsNumber()
  @Min(1)
  servingSizeG: number;

  @ApiProperty({ example: 151 })
  @IsNumber()
  @Min(0)
  caloriesPer100g: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  proteinPer100g: number;

  @ApiProperty({ example: 17 })
  @IsNumber()
  @Min(0)
  carbsPer100g: number;

  @ApiProperty({ example: 3.5 })
  @IsNumber()
  @Min(0)
  totalFatPer100g: number;

  @ApiPropertyOptional({ example: 0.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  saturatedFatPer100g?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  omega3Per100g?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transFatPer100g?: number;

  @ApiPropertyOptional({ example: 2.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fiberPer100g?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageAssetPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayTag?: string;

  @ApiPropertyOptional({ enum: FoodSource, default: FoodSource.adminCatalog })
  @IsOptional()
  @IsEnum(FoodSource)
  source?: FoodSource;
}

export class UpdateAdminFoodDto extends PartialType(CreateAdminFoodDto) {}
