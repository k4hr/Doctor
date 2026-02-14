/* path: prisma/migrations/202602140001_add_consultations/migration.sql */

BEGIN;

-- ===========================
-- 0) ENUM types (PostgreSQL)
-- ===========================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationStatus') THEN
    CREATE TYPE "ConsultationStatus" AS ENUM ('DRAFT','PENDING','ACCEPTED','DECLINED','CLOSED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationFileKind') THEN
    CREATE TYPE "ConsultationFileKind" AS ENUM ('PHOTO');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationMessageAuthorType') THEN
    CREATE TYPE "ConsultationMessageAuthorType" AS ENUM ('USER','DOCTOR');
  END IF;
END$$;

-- ===========================
-- 1) Doctor: добавляем настройки консультаций (если их ещё нет)
-- ===========================

ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "consultationEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "consultationPriceRub" INTEGER NOT NULL DEFAULT 1000;

-- индексы на Doctor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Doctor_consultationEnabled_idx'
  ) THEN
    CREATE INDEX "Doctor_consultationEnabled_idx" ON "Doctor" ("consultationEnabled");
  END IF;
END$$;

-- ===========================
-- 2) Таблица Consultation
-- ===========================

CREATE TABLE IF NOT EXISTS "Consultation" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "doctorId" TEXT NOT NULL,

  "authorTelegramId" TEXT NOT NULL,
  "authorUsername" TEXT,
  "authorFirstName" TEXT,
  "authorLastName" TEXT,
  "consult_authorisanonymous" BOOLEAN NOT NULL DEFAULT true,

  "body" TEXT NOT NULL,
  "priceRub" INTEGER NOT NULL DEFAULT 1000,

  "status" "ConsultationStatus" NOT NULL DEFAULT 'DRAFT',

  CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- FK: Consultation.doctorId -> Doctor.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Consultation_doctorId_fkey'
  ) THEN
    ALTER TABLE "Consultation"
      ADD CONSTRAINT "Consultation_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- индексы Consultation
CREATE INDEX IF NOT EXISTS "Consultation_doctorId_idx" ON "Consultation"("doctorId");
CREATE INDEX IF NOT EXISTS "Consultation_authorTelegramId_idx" ON "Consultation"("authorTelegramId");
CREATE INDEX IF NOT EXISTS "Consultation_status_idx" ON "Consultation"("status");
CREATE INDEX IF NOT EXISTS "Consultation_createdAt_idx" ON "Consultation"("createdAt");
CREATE INDEX IF NOT EXISTS "Consultation_doctorId_status_createdAt_idx" ON "Consultation"("doctorId","status","createdAt");
CREATE INDEX IF NOT EXISTS "Consultation_authorTelegramId_status_createdAt_idx" ON "Consultation"("authorTelegramId","status","createdAt");

-- ===========================
-- 3) Таблица ConsultationFile
-- ===========================

CREATE TABLE IF NOT EXISTS "ConsultationFile" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "consultationId" TEXT NOT NULL,

  "kind" "ConsultationFileKind" NOT NULL,
  "url" TEXT NOT NULL,
  "mime" TEXT,
  "sizeBytes" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "ConsultationFile_pkey" PRIMARY KEY ("id")
);

-- FK: ConsultationFile.consultationId -> Consultation.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ConsultationFile_consultationId_fkey'
  ) THEN
    ALTER TABLE "ConsultationFile"
      ADD CONSTRAINT "ConsultationFile_consultationId_fkey"
      FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- индексы ConsultationFile
CREATE INDEX IF NOT EXISTS "ConsultationFile_consultationId_idx" ON "ConsultationFile"("consultationId");
CREATE INDEX IF NOT EXISTS "ConsultationFile_kind_idx" ON "ConsultationFile"("kind");
CREATE INDEX IF NOT EXISTS "ConsultationFile_consultationId_kind_idx" ON "ConsultationFile"("consultationId","kind");
CREATE INDEX IF NOT EXISTS "ConsultationFile_consultationId_kind_sortOrder_idx" ON "ConsultationFile"("consultationId","kind","sortOrder");

-- ===========================
-- 4) Таблица ConsultationMessage
-- ===========================

CREATE TABLE IF NOT EXISTS "ConsultationMessage" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "consultationId" TEXT NOT NULL,

  "authorType" "ConsultationMessageAuthorType" NOT NULL,

  "authorDoctorId" TEXT,
  "authorTelegramId" TEXT,

  "body" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "ConsultationMessage_pkey" PRIMARY KEY ("id")
);

-- FK: ConsultationMessage.consultationId -> Consultation.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ConsultationMessage_consultationId_fkey'
  ) THEN
    ALTER TABLE "ConsultationMessage"
      ADD CONSTRAINT "ConsultationMessage_consultationId_fkey"
      FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- FK: ConsultationMessage.authorDoctorId -> Doctor.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ConsultationMessage_authorDoctorId_fkey'
  ) THEN
    ALTER TABLE "ConsultationMessage"
      ADD CONSTRAINT "ConsultationMessage_authorDoctorId_fkey"
      FOREIGN KEY ("authorDoctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- индексы ConsultationMessage
CREATE INDEX IF NOT EXISTS "ConsultationMessage_consultationId_idx" ON "ConsultationMessage"("consultationId");
CREATE INDEX IF NOT EXISTS "ConsultationMessage_authorDoctorId_idx" ON "ConsultationMessage"("authorDoctorId");
CREATE INDEX IF NOT EXISTS "ConsultationMessage_authorTelegramId_idx" ON "ConsultationMessage"("authorTelegramId");
CREATE INDEX IF NOT EXISTS "ConsultationMessage_consultationId_createdAt_idx" ON "ConsultationMessage"("consultationId","createdAt");

COMMIT;
