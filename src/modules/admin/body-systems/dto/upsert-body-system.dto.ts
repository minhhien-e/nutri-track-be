import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBodySystemDto {
  @ApiProperty({ example: 'Hệ tim mạch' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Cung cấp oxy và dưỡng chất...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: { 'Vitamin C': 8, 'Canxi': 5 },
    description: 'Dynamic nutrients to link to the body system (key: nutrient name, value: impact level 1-10)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  nutrients?: Record<string, number>;
}

export class UpdateBodySystemDto {
  @ApiProperty({ example: 'Hệ tim mạch', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Cung cấp oxy và dưỡng chất...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: { 'Vitamin C': 8, 'Canxi': 5 },
    description: 'Dynamic nutrients to link to the body system (key: nutrient name, value: impact level 1-10)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  nutrients?: Record<string, number>;
}
