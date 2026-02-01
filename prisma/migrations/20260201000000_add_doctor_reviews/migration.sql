-- Add rating aggregates to Doctor
ALTER TABLE "Doctor"
ADD COLUMN "ratingSum" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Doctor"
ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DoctorReview" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  "doctorId" TEXT NOT NULL,
  "authorTelegramId" TEXT NOT NULL,

  "rating" INTEGER NOT NULL,
  "text" TEXT,

  "questionId" TEXT,
  "answerId" TEXT,

  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT "DoctorReview_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "DoctorReview_doctorId_idx" ON "DoctorReview"("doctorId");
CREATE INDEX "DoctorReview_doctorId_createdAt_idx" ON "DoctorReview"("doctorId", "createdAt");
CREATE INDEX "DoctorReview_authorTelegramId_idx" ON "DoctorReview"("authorTelegramId");
CREATE INDEX "DoctorReview_questionId_idx" ON "DoctorReview"("questionId");
CREATE INDEX "DoctorReview_answerId_idx" ON "DoctorReview"("answerId");

-- Foreign keys
ALTER TABLE "DoctorReview"
ADD CONSTRAINT "DoctorReview_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "DoctorReview"
ADD CONSTRAINT "DoctorReview_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "Question"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "DoctorReview"
ADD CONSTRAINT "DoctorReview_answerId_fkey"
FOREIGN KEY ("answerId") REFERENCES "Answer"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
