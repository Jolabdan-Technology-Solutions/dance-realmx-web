-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('FREE', 'SILVER', 'GOLD', 'PLATINUM');
ALTER TABLE "User" ALTER COLUMN "subscription_tier" TYPE "SubscriptionTier_new" USING ("subscription_tier"::text::"SubscriptionTier_new");
ALTER TABLE "subscription_plans" ALTER COLUMN "tier" TYPE "SubscriptionTier_new" USING ("tier"::text::"SubscriptionTier_new");
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "SubscriptionTier_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'DIRECTORY_MEMBER';
ALTER TYPE "UserRole" ADD VALUE 'CERTIFICATION_MANAGER';

-- DropForeignKey
ALTER TABLE "UserRoleMapping" DROP CONSTRAINT "UserRoleMapping_tenant_id_fkey";

-- DropIndex
DROP INDEX "UserRoleMapping_user_id_tenant_id_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "tier",
ADD COLUMN     "plan_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserRoleMapping" DROP COLUMN "tenant_id",
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL;

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "features" TEXT[],
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2) NOT NULL,
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdYearly" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isStandalone" BOOLEAN NOT NULL DEFAULT false,
    "planType" TEXT NOT NULL DEFAULT 'main',
    "featureDetails" JSONB,
    "unlockedRoles" "UserRole"[],
    "tier" "SubscriptionTier" NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleMapping_user_id_role_key" ON "UserRoleMapping"("user_id", "role");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

