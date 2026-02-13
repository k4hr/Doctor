/* path: prisma/migrations/202602130001_add_review_anonymous_and_uniques/migration.sql */

-- 1) DoctorReview: add isAnonymous (db column: isanonymouse -> НЕПРАВИЛЬНО, нужно isanonymouS)
-- Prisma schema:
-- isAnonymous Boolean @default(true) @map("isanonymous")

ALTER TABLE "DoctorReview"
  ADD COLUMN IF NOT EXISTS "isanonymous" BOOLEAN NOT NULL DEFAULT true;

-- на всякий (если вдруг когда-то было nullable/битые данные)
UPDATE "DoctorReview"
SET "isanonymous" = true
WHERE "isanonymous" IS NULL;

-- 2) uniques: защита от дублей

-- UNIQUE (doctorId, authorTelegramId, questionId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'DoctorReview_doctorId_authorTelegramId_questionId_key'
  ) THEN
    ALTER TABLE "DoctorReview"
      ADD CONSTRAINT "DoctorReview_doctorId_authorTelegramId_questionId_key"
      UNIQUE ("doctorId", "authorTelegramId", "questionId");
  END IF;
END$$;

-- UNIQUE (doctorId, authorTelegramId, answerId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'DoctorReview_doctorId_authorTelegramId_answerId_key'
  ) THEN
    ALTER TABLE "DoctorReview"
      ADD CONSTRAINT "DoctorReview_doctorId_authorTelegramId_answerId_key"
      UNIQUE ("doctorId", "authorTelegramId", "answerId");
  END IF;
END$$;

-- 3) indexes (Prisma @@index(...) обычно делает их сам, но если ты руками ведёшь миграции — добавим)
CREATE INDEX IF NOT EXISTS "DoctorReview_doctorId_idx" ON "DoctorReview"("doctorId");
CREATE INDEX IF NOT EXISTS "DoctorReview_doctorId_createdAt_idx" ON "DoctorReview"("doctorId", "createdAt");
CREATE INDEX IF NOT EXISTS "DoctorReview_authorTelegramId_idx" ON "DoctorReview"("authorTelegramId");
CREATE INDEX IF NOT EXISTS "DoctorReview_questionId_idx" ON "DoctorReview"("questionId");
CREATE INDEX IF NOT EXISTS "DoctorReview_answerId_idx" ON "DoctorReview"("answerId");
