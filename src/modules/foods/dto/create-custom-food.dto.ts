import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomFoodDto {
  @ApiProperty({ example: 'Ức gà áp chảo nhà làm' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  servingSizeG: number;

  @ApiProperty({ example: 165 })
  @IsNumber()
  @Min(0)
  caloriesPer100g: number;

  @ApiProperty({ example: 31 })
  @IsNumber()
  @Min(0)
  proteinPer100g: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  carbsPer100g: number;

  @ApiProperty({ example: 3.6 })
  @IsNumber()
  @Min(0)
  fatPer100g: number;

  @ApiPropertyOptional({ example: 3.6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalFatPer100g?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  saturatedFatPer100g?: number;

  @ApiPropertyOptional({ example: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  omega3Per100g?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transFatPer100g?: number;

  @ApiPropertyOptional({ example: 2.5 })
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
}
