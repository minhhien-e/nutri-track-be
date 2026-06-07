import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsNumber, Max, Min } from "class-validator";

export class UpsertWeeklyWeightLogDto {
  @ApiProperty({ example: "2026-06-14T00:00:00.000Z" })
  @Type(() => Date)
  @IsDate()
  measuredDate: Date;

  @ApiProperty({ example: 67.5 })
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg: number;
}
