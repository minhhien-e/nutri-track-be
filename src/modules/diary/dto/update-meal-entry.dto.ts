import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMealEntryDto {
  @ApiPropertyOptional({ example: 'chicken-breast' })
  @IsOptional()
  @IsString()
  foodItemId?: string;

  @IsOptional()

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  grams?: number;
}
