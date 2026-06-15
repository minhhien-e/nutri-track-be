ALTER TABLE "NutritionTarget"
ADD COLUMN IF NOT EXISTS "estimatedTdee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "actualTdee" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "actualTdeeCalculatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "actualTdeeWindowDays" INTEGER;

UPDATE "NutritionTarget"
SET "estimatedTdee" = CASE
  WHEN "dailyTotalBurnKcal" > 0 THEN "dailyTotalBurnKcal"
  ELSE "tdee"
END
WHERE "estimatedTdee" = 0;
