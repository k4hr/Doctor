-- prisma/migrations/20260215_thanks/migration.sql
BEGIN;

-- 1) Добавляем флаг thanksEnabled на Doctor
ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "thanksEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

-- индекс по thanksEnabled (ускорит фильтры/ленты)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Doctor_thanksEnabled_idx'
  ) THEN
    CREATE INDEX "Doctor_thanksEnabled_idx" ON "Doctor" ("thanksEnabled");
  END IF;
END$$;

-- 2) Enum ThanksStatus
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ThanksStatus') THEN
    CREATE TYPE "ThanksStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'FAILED', 'CANCELED');
  END IF;
END$$;

-- 3) Таблица Thanks
CREATE TABLE IF NOT EXISTS "Thanks" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  "doctorId" TEXT NOT NULL,

  "authorTelegramId" TEXT NOT NULL,
  "authorUsername" TEXT,
  "authorFirstName" TEXT,
  "authorLastName" TEXT,
  "thanks_authorisanonymous" BOOLEAN NOT NULL DEFAULT TRUE,

  "amountRub" INTEGER NOT NULL,
  "message" TEXT,

  "status" "ThanksStatus" NOT NULL DEFAULT 'DRAFT',

  "provider" TEXT,
  "paymentId" TEXT,
  "meta" JSONB,

  CONSTRAINT "Thanks_pkey" PRIMARY KEY ("id")
);

-- уникальность paymentId (не дублируем)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Thanks_paymentId_key'
  ) THEN
    CREATE UNIQUE INDEX "Thanks_paymentId_key" ON "Thanks" ("paymentId");
  END IF;
END$$;

-- FK на Doctor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Thanks_doctorId_fkey'
  ) THEN
    ALTER TABLE "Thanks"
      ADD CONSTRAINT "Thanks_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- индексы
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Thanks_doctorId_idx'
  ) THEN
    CREATE INDEX "Thanks_doctorId_idx" ON "Thanks" ("doctorId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Thanks_doctorId_createdAt_idx'
  ) THEN
    CREATE INDEX "Thanks_doctorId_createdAt_idx" ON "Thanks" ("doctorId", "createdAt");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Thanks_authorTelegramId_idx'
  ) THEN
    CREATE INDEX "Thanks_authorTelegramId_idx" ON "Thanks" ("authorTelegramId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Thanks_status_idx'
  ) THEN
    CREATE INDEX "Thanks_status_idx" ON "Thanks" ("status");
  END IF;
END$$;

COMMIT;
