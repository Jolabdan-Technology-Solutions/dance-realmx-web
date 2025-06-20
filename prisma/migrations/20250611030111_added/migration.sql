/*
  Warnings:

  - A unique constraint covering the columns `[short_name]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `detailed_description` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty_level` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'INSTRUCTOR';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "detailed_description" TEXT NOT NULL,
ADD COLUMN     "difficulty_level" TEXT NOT NULL,
ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "short_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Course_short_name_key" ON "Course"("short_name");
