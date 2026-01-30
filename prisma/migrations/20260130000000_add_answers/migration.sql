-- CreateEnum
CREATE TYPE "AnswerCommentAuthorType" AS ENUM ('USER', 'DOCTOR');

-- CreateTable
CREATE TABLE "Answer" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  "questionId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,

  "body" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

-- CreateIndex
CREATE INDEX "Answer_doctorId_idx" ON "Answer"("doctorId");

-- CreateIndex
CREATE INDEX "Answer_questionId_createdAt_idx" ON "Answer"("questionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_doctorId_key" ON "Answer"("questionId", "doctorId");

-- AddForeignKey
ALTER TABLE "Answer"
ADD CONSTRAINT "Answer_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "Question"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer"
ADD CONSTRAINT "Answer_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AnswerComment" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  "answerId" TEXT NOT NULL,

  "authorType" "AnswerCommentAuthorType" NOT NULL,
  "authorDoctorId" TEXT,
  "authorTelegramId" TEXT,

  "body" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT "AnswerComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnswerComment_answerId_idx" ON "AnswerComment"("answerId");

-- CreateIndex
CREATE INDEX "AnswerComment_authorDoctorId_idx" ON "AnswerComment"("authorDoctorId");

-- CreateIndex
CREATE INDEX "AnswerComment_authorTelegramId_idx" ON "AnswerComment"("authorTelegramId");

-- CreateIndex
CREATE INDEX "AnswerComment_answerId_createdAt_idx" ON "AnswerComment"("answerId", "createdAt");

-- AddForeignKey
ALTER TABLE "AnswerComment"
ADD CONSTRAINT "AnswerComment_answerId_fkey"
FOREIGN KEY ("answerId") REFERENCES "Answer"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerComment"
ADD CONSTRAINT "AnswerComment_authorDoctorId_fkey"
FOREIGN KEY ("authorDoctorId") REFERENCES "Doctor"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
