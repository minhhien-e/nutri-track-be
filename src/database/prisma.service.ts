import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.ensureAdaptiveTdeeColumns();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureAdaptiveTdeeColumns() {
    await this.$executeRawUnsafe(`
      ALTER TABLE "NutritionTarget"
      ADD COLUMN IF NOT EXISTS "estimatedTdee" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "actualTdee" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "actualTdeeCalculatedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "actualTdeeWindowDays" INTEGER
    `);
    const updatedRows = await this.$executeRawUnsafe(`
      UPDATE "NutritionTarget"
      SET "estimatedTdee" = CASE
        WHEN "dailyTotalBurnKcal" > 0 THEN "dailyTotalBurnKcal"
        ELSE "tdee"
      END
      WHERE "estimatedTdee" = 0
    `);
    if (updatedRows > 0) {
      this.logger.log(
        `Initialized estimated TDEE for ${updatedRows} nutrition target(s)`,
      );
    }
  }
}
