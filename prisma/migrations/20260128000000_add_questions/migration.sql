-- prisma/migrations/20260128000000_add_questions/migration.sql

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "QuestionFileKind" AS ENUM ('PHOTO');

-- CreateTable
CREATE TABLE "Question" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  "authorTelegramId" TEXT NOT NULL,
  "authorUsername" TEXT,
  "authorFirstName" TEXT,
  "authorLastName" TEXT,

  -- ✅ новое: выбор анонимности
  "authorIsAnonymous" BOOLEAN NOT NULL DEFAULT TRUE,

  "speciality" TEXT NOT NULL,

  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,

  "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN',

  "assignedDoctorId" TEXT,
  "answeredByDoctorId" TEXT,

  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_speciality_idx" ON "Question"("speciality");

-- CreateIndex
CREATE INDEX "Question_status_idx" ON "Question"("status");

-- CreateIndex
CREATE INDEX "Question_createdAt_idx" ON "Question"("createdAt");

-- CreateIndex
CREATE INDEX "Question_assignedDoctorId_idx" ON "Question"("assignedDoctorId");

-- CreateIndex
CREATE INDEX "Question_answeredByDoctorId_idx" ON "Question"("answeredByDoctorId");

-- AddForeignKey (AssignedDoctor)
ALTER TABLE "Question"
ADD CONSTRAINT "Question_assignedDoctorId_fkey"
FOREIGN KEY ("assignedDoctorId") REFERENCES "Doctor"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey (AnsweredDoctor)
ALTER TABLE "Question"
ADD CONSTRAINT "Question_answeredByDoctorId_fkey"
FOREIGN KEY ("answeredByDoctorId") REFERENCES "Doctor"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "QuestionFile" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "questionId" TEXT NOT NULL,

  "kind" "QuestionFileKind" NOT NULL,
  "url" TEXT NOT NULL,
  "mime" TEXT,
  "sizeBytes" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "QuestionFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuestionFile"
ADD CONSTRAINT "QuestionFile_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "Question"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "QuestionFile_questionId_idx" ON "QuestionFile"("questionId");

-- CreateIndex
CREATE INDEX "QuestionFile_kind_idx" ON "QuestionFile"("kind");

-- CreateIndex
CREATE INDEX "QuestionFile_questionId_kind_idx" ON "QuestionFile"("questionId", "kind");

-- CreateIndex
CREATE INDEX "QuestionFile_questionId_kind_sortOrder_idx" ON "QuestionFile"("questionId", "kind", "sortOrder");
