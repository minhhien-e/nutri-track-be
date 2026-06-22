import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateWaterDto {
  @ApiProperty({ example: 1750 })
  @IsNumber()
  @Min(0)
  @Max(10000)
  waterMl: number;
}
