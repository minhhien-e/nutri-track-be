ALTER TABLE "NutritionTarget"
ADD COLUMN "startDate" TIMESTAMP(3);

UPDATE "NutritionTarget"
SET "startDate" = COALESCE("calculatedAt", CURRENT_TIMESTAMP);

ALTER TABLE "NutritionTarget"
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "WeeklyWeightLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "measuredDate" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyWeightLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyWeightLog_userId_weekKey_key" ON "WeeklyWeightLog"("userId", "weekKey");
CREATE INDEX "WeeklyWeightLog_weekKey_idx" ON "WeeklyWeightLog"("weekKey");

ALTER TABLE "WeeklyWeightLog"
ADD CONSTRAINT "WeeklyWeightLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
