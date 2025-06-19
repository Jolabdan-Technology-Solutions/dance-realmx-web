/*
  Warnings:

  - The values [SILVER,GOLD,PLATINUM] on the enum `SubscriptionTier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('FREE', 'NOBILITY', 'IMPERIAL', 'ROYAL');
ALTER TABLE "User" ALTER COLUMN "subscription_tier" TYPE "SubscriptionTier_new" USING ("subscription_tier"::text::"SubscriptionTier_new");
ALTER TABLE "subscription_plans" ALTER COLUMN "tier" TYPE "SubscriptionTier_new" USING ("tier"::text::"SubscriptionTier_new");
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "SubscriptionTier_old";
COMMIT;
