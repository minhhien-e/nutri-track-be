ALTER TABLE "NutritionTarget"
ADD COLUMN "estimatedTdee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "actualTdee" DOUBLE PRECISION,
ADD COLUMN "actualTdeeCalculatedAt" TIMESTAMP(3),
ADD COLUMN "actualTdeeWindowDays" INTEGER;

UPDATE "NutritionTarget"
SET "estimatedTdee" = CASE
  WHEN "dailyTotalBurnKcal" > 0 THEN "dailyTotalBurnKcal"
  ELSE "tdee"
END
WHERE "estimatedTdee" = 0;
