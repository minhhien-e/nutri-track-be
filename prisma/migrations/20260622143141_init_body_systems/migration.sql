-- CreateEnum
CREATE TYPE "NutrientCategory" AS ENUM ('vitamin', 'mineral', 'macro', 'other');

-- CreateTable
CREATE TABLE "BodySystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodySystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "category" "NutrientCategory" NOT NULL DEFAULT 'other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodySystemNutrient" (
    "id" TEXT NOT NULL,
    "bodySystemId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "impactLevel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BodySystemNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodNutrient" (
    "id" TEXT NOT NULL,
    "foodItemId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "amountPer100g" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FoodNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BodySystem_name_key" ON "BodySystem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Nutrient_name_key" ON "Nutrient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BodySystemNutrient_bodySystemId_nutrientId_key" ON "BodySystemNutrient"("bodySystemId", "nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodNutrient_foodItemId_nutrientId_key" ON "FoodNutrient"("foodItemId", "nutrientId");

-- AddForeignKey
ALTER TABLE "BodySystemNutrient" ADD CONSTRAINT "BodySystemNutrient_bodySystemId_fkey" FOREIGN KEY ("bodySystemId") REFERENCES "BodySystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodySystemNutrient" ADD CONSTRAINT "BodySystemNutrient_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodNutrient" ADD CONSTRAINT "FoodNutrient_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodNutrient" ADD CONSTRAINT "FoodNutrient_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "Nutrient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
