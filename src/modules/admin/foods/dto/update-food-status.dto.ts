import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateFoodStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
