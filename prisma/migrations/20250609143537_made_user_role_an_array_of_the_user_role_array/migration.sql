/*
  Warnings:

  - Changed the column `role` on the `User` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
ALTER TABLE "User" 
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole"[] USING ARRAY[role]::"UserRole"[],
  ALTER COLUMN "role" SET DEFAULT ARRAY['GUEST_USER']::"UserRole"[];
