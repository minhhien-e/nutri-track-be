-- Add user roles for admin authorization.
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Add soft enable/disable support for catalog foods.
ALTER TABLE "FoodItem"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Replace legacy/mock source names with production source names.
CREATE TYPE "FoodSource_new" AS ENUM ('adminCatalog', 'external', 'custom');

ALTER TABLE "FoodItem"
ALTER COLUMN "source" TYPE "FoodSource_new"
USING (
  CASE "source"::text
    WHEN 'remoteApi' THEN 'external'
    WHEN 'custom' THEN 'custom'
    ELSE 'adminCatalog'
  END::"FoodSource_new"
);

DROP TYPE "FoodSource";
ALTER TYPE "FoodSource_new" RENAME TO "FoodSource";
