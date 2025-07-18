-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "course_id" INTEGER;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "average_rating" DOUBLE PRECISION,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "completion_percentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "stripe_customer_id" TEXT;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "course_id" INTEGER,
ADD COLUMN     "lesson_id" INTEGER,
ADD COLUMN     "module_id" INTEGER;

-- AlterTable
ALTER TABLE "ResourcePurchase" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "purchased_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "correct" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttemptAnswer" (
    "id" SERIAL NOT NULL,
    "attempt_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "QuizAttemptAnswer_pkey" PRIMARY KEY ("id")
);
