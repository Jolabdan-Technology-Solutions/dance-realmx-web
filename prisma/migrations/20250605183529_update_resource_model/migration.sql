/*
  Warnings:

  - You are about to drop the column `category_id` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `file_url` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `is_published` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `seller_id` on the `Resource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sellerId` to the `Resource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Resource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "category_id",
DROP COLUMN "file_url",
DROP COLUMN "is_published",
DROP COLUMN "seller_id",
ADD COLUMN     "ageRange" TEXT,
ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "danceStyle" TEXT,
ADD COLUMN     "difficultyLevel" TEXT,
ADD COLUMN     "sellerId" INTEGER NOT NULL,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
