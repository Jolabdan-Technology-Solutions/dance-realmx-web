/*
  Warnings:

  - A unique constraint covering the columns `[user_id,tenant_id]` on the table `UserRoleMapping` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `preview_video_url` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_url` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `UserRoleMapping` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserRoleMapping_user_id_role_key";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "preview_video_url" TEXT NOT NULL,
ADD COLUMN     "video_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenant_id" INTEGER,
ALTER COLUMN "role" SET DEFAULT 'GUEST_USER';

-- AlterTable
ALTER TABLE "UserRoleMapping" ADD COLUMN     "tenant_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleMapping_user_id_tenant_id_key" ON "UserRoleMapping"("user_id", "tenant_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleMapping" ADD CONSTRAINT "UserRoleMapping_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
