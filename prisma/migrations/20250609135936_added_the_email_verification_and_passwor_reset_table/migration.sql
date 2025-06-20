-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_course_id_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_user_id_fkey";

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);
