-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER,
    "resource_id" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartItem_user_id_idx" ON "CartItem"("user_id");

-- CreateIndex
CREATE INDEX "CartItem_course_id_idx" ON "CartItem"("course_id");

-- CreateIndex
CREATE INDEX "CartItem_resource_id_idx" ON "CartItem"("resource_id");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE; 