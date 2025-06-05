/*
  Warnings:

  - You are about to drop the column `stripe_customer_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Payment` table. All the data in the column will be lost.
  - The `status` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `reference_type` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionFrequency" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'CANCELED', 'FAILED');

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripe_customer_id",
DROP COLUMN "type",
ADD COLUMN     "reference_type" "PaymentType" NOT NULL,
ADD COLUMN     "stripe_session_id" TEXT,
ALTER COLUMN "stripe_payment_intent_id" DROP NOT NULL,
ALTER COLUMN "reference_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "frequency" "SubscriptionFrequency" NOT NULL,
ADD COLUMN     "stripe_session_id" TEXT,
ALTER COLUMN "stripe_subscription_id" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';
