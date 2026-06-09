-- CreateEnum
CREATE TYPE "MealPlanDefaultScope" AS ENUM ('day', 'week');

-- CreateTable
CREATE TABLE "MealPlanDefault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "MealPlanDefaultScope" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "dateKey" TEXT,
    "weekday" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlanDefaultItem" (
    "id" TEXT NOT NULL,
    "mealPlanDefaultId" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MealPlanDefaultItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPlanDefault_userId_enabled_scope_idx" ON "MealPlanDefault"("userId", "enabled", "scope");

-- CreateIndex
CREATE INDEX "MealPlanDefault_dateKey_idx" ON "MealPlanDefault"("dateKey");

-- CreateIndex
CREATE INDEX "MealPlanDefault_weekday_idx" ON "MealPlanDefault"("weekday");

-- CreateIndex
CREATE INDEX "MealPlanDefaultItem_mealPlanDefaultId_idx" ON "MealPlanDefaultItem"("mealPlanDefaultId");

-- CreateIndex
CREATE INDEX "MealPlanDefaultItem_foodItemId_idx" ON "MealPlanDefaultItem"("foodItemId");

-- AddForeignKey
ALTER TABLE "MealPlanDefault" ADD CONSTRAINT "MealPlanDefault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanDefaultItem" ADD CONSTRAINT "MealPlanDefaultItem_mealPlanDefaultId_fkey" FOREIGN KEY ("mealPlanDefaultId") REFERENCES "MealPlanDefault"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanDefaultItem" ADD CONSTRAINT "MealPlanDefaultItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
