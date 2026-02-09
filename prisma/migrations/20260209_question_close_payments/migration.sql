-- prisma/migrations/20260209_question_close_payments/migration.sql

BEGIN;

-- 1) Добавляем поля в Question: isFree + priceRub
ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "priceRub" INTEGER NOT NULL DEFAULT 0;

-- индекс по isFree (ускорит фильтры/ленты)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Question_isFree_idx'
  ) THEN
    CREATE INDEX "Question_isFree_idx" ON "Question" ("isFree");
  END IF;
END$$;

-- 2) Enum для статуса закрытия
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionCloseStatus') THEN
    CREATE TYPE "QuestionCloseStatus" AS ENUM ('CREATED', 'PAID');
  END IF;
END$$;

-- 3) Таблица QuestionClose (1:1)
CREATE TABLE IF NOT EXISTS "QuestionClose" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "questionId" TEXT NOT NULL,
  "authorTelegramId" TEXT NOT NULL,

  "status" "QuestionCloseStatus" NOT NULL DEFAULT 'CREATED',

  -- выбранные врачи (до 3) — валидируешь в API
  "selectedDoctorIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- сколько было распределено (0 для бесплатных)
  "totalRub" INTEGER NOT NULL DEFAULT 0,

  -- сколько на каждого (для UI)
  "perDoctorRub" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "QuestionClose_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionClose_questionId_key" UNIQUE ("questionId"),
  CONSTRAINT "QuestionClose_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- индексы
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'QuestionClose_questionId_idx'
  ) THEN
    CREATE INDEX "QuestionClose_questionId_idx" ON "QuestionClose" ("questionId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'QuestionClose_authorTelegramId_idx'
  ) THEN
    CREATE INDEX "QuestionClose_authorTelegramId_idx" ON "QuestionClose" ("authorTelegramId");
  END IF;
END$$;

COMMIT;
