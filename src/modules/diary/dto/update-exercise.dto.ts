import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateExerciseDto {
  @ApiProperty({ example: 320 })
  @IsNumber()
  @Min(0)
  @Max(5000)
  exerciseCalories: number;
}
