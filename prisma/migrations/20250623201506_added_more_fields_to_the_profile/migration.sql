/*
  Warnings:

  - You are about to drop the column `created_at` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "availability" JSONB,
ADD COLUMN     "dance_style" TEXT[],
ADD COLUMN     "location" TEXT,
ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "price_max" INTEGER,
ADD COLUMN     "price_min" INTEGER,
ADD COLUMN     "pricing" INTEGER,
ADD COLUMN     "service_category" TEXT[],
ADD COLUMN     "services" TEXT[],
ADD COLUMN     "session_duration" INTEGER,
ADD COLUMN     "travel_distance" INTEGER,
ADD COLUMN     "years_experience" INTEGER;
