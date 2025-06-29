-- CreateTable
CREATE TABLE "Quiz" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "answer" INTEGER,
    "order" INTEGER,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);
