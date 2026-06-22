/*
  Warnings:

  - You are about to drop the column `mealType` on the `MealEntry` table. All the data in the column will be lost.
  - You are about to drop the column `mealType` on the `MealPlanDefaultItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MealEntry" DROP COLUMN "mealType";

-- AlterTable
ALTER TABLE "MealPlanDefaultItem" DROP COLUMN "mealType";

-- DropEnum
DROP TYPE "MealType";
