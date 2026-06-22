import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateMealEntryDto {
  @ApiProperty({ example: 'chicken-breast' })
  @IsString()
  foodItemId: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(1)
  grams: number;
}
