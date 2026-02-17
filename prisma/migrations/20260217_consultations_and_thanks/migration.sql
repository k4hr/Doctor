-- prisma/migrations/20260217_consultations_and_thanks/migration.sql

-- ===========================
-- 1) ENUM types (Postgres)
-- ===========================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationStatus') THEN
    CREATE TYPE "ConsultationStatus" AS ENUM ('DRAFT','PENDING','ACCEPTED','DECLINED','CLOSED');
  END IF;
END$$;

-- если enum уже есть — добиваем недостающие значения
DO $$
DECLARE
  t_oid oid;
BEGIN
  SELECT oid INTO t_oid FROM pg_type WHERE typname = 'ConsultationStatus';
  IF t_oid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'DRAFT') THEN
      ALTER TYPE "ConsultationStatus" ADD VALUE 'DRAFT';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'PENDING') THEN
      ALTER TYPE "ConsultationStatus" ADD VALUE 'PENDING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'ACCEPTED') THEN
      ALTER TYPE "ConsultationStatus" ADD VALUE 'ACCEPTED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'DECLINED') THEN
      ALTER TYPE "ConsultationStatus" ADD VALUE 'DECLINED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'CLOSED') THEN
      ALTER TYPE "ConsultationStatus" ADD VALUE 'CLOSED';
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationFileKind') THEN
    CREATE TYPE "ConsultationFileKind" AS ENUM ('PHOTO');
  END IF;
END$$;

DO $$
DECLARE
  t_oid oid;
BEGIN
  SELECT oid INTO t_oid FROM pg_type WHERE typname = 'ConsultationFileKind';
  IF t_oid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'PHOTO') THEN
      ALTER TYPE "ConsultationFileKind" ADD VALUE 'PHOTO';
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationMessageAuthorType') THEN
    CREATE TYPE "ConsultationMessageAuthorType" AS ENUM ('USER','DOCTOR');
  END IF;
END$$;

DO $$
DECLARE
  t_oid oid;
BEGIN
  SELECT oid INTO t_oid FROM pg_type WHERE typname = 'ConsultationMessageAuthorType';
  IF t_oid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'USER') THEN
      ALTER TYPE "ConsultationMessageAuthorType" ADD VALUE 'USER';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'DOCTOR') THEN
      ALTER TYPE "ConsultationMessageAuthorType" ADD VALUE 'DOCTOR';
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ThanksStatus') THEN
    CREATE TYPE "ThanksStatus" AS ENUM ('DRAFT','PENDING','PAID','FAILED','CANCELED');
  END IF;
END$$;

DO $$
DECLARE
  t_oid oid;
BEGIN
  SELECT oid INTO t_oid FROM pg_type WHERE typname = 'ThanksStatus';
  IF t_oid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'DRAFT') THEN
      ALTER TYPE "ThanksStatus" ADD VALUE 'DRAFT';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'PENDING') THEN
      ALTER TYPE "ThanksStatus" ADD VALUE 'PENDING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'PAID') THEN
      ALTER TYPE "ThanksStatus" ADD VALUE 'PAID';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'FAILED') THEN
      ALTER TYPE "ThanksStatus" ADD VALUE 'FAILED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t_oid AND enumlabel = 'CANCELED') THEN
      ALTER TYPE "ThanksStatus" ADD VALUE 'CANCELED';
    END IF;
  END IF;
END$$;

-- ===========================
-- 2) Doctor: flags + price
-- ===========================

ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "consultationEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "consultationPriceRub" INTEGER NOT NULL DEFAULT 1000;

ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "thanksEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Doctor_consultationEnabled_idx'
  ) THEN
    CREATE INDEX "Doctor_consultationEnabled_idx" ON "Doctor" ("consultationEnabled");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Doctor_thanksEnabled_idx'
  ) THEN
    CREATE INDEX "Doctor_thanksEnabled_idx" ON "Doctor" ("thanksEnabled");
  END IF;
END$$;

-- ===========================
-- 3) Consultation tables
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
  "consult_authorisanonymous" BOOLEAN NOT NULL DEFAULT TRUE,

  "body" TEXT NOT NULL,
  "priceRub" INTEGER NOT NULL DEFAULT 1000,
  "status" "ConsultationStatus" NOT NULL DEFAULT 'DRAFT',

  CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Consultation_doctorId_fkey') THEN
    ALTER TABLE "Consultation"
      ADD CONSTRAINT "Consultation_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Consultation_doctorId_idx') THEN
    CREATE INDEX "Consultation_doctorId_idx" ON "Consultation" ("doctorId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Consultation_authorTelegramId_idx') THEN
    CREATE INDEX "Consultation_authorTelegramId_idx" ON "Consultation" ("authorTelegramId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Consultation_status_idx') THEN
    CREATE INDEX "Consultation_status_idx" ON "Consultation" ("status");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Consultation_createdAt_idx') THEN
    CREATE INDEX "Consultation_createdAt_idx" ON "Consultation" ("createdAt");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Consultation_doctorId_status_createdAt_idx') THEN
    CREATE INDEX "Consultation_doctorId_status_createdAt_idx" ON "Consultation" ("doctorId","status","createdAt");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Consultation_authorTelegramId_status_createdAt_idx') THEN
    CREATE INDEX "Consultation_authorTelegramId_status_createdAt_idx" ON "Consultation" ("authorTelegramId","status","createdAt");
  END IF;
END$$;

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationFile_consultationId_fkey') THEN
    ALTER TABLE "ConsultationFile"
      ADD CONSTRAINT "ConsultationFile_consultationId_fkey"
      FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationFile_consultationId_idx') THEN
    CREATE INDEX "ConsultationFile_consultationId_idx" ON "ConsultationFile" ("consultationId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationFile_kind_idx') THEN
    CREATE INDEX "ConsultationFile_kind_idx" ON "ConsultationFile" ("kind");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationFile_consultationId_kind_idx') THEN
    CREATE INDEX "ConsultationFile_consultationId_kind_idx" ON "ConsultationFile" ("consultationId","kind");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationFile_consultationId_kind_sortOrder_idx') THEN
    CREATE INDEX "ConsultationFile_consultationId_kind_sortOrder_idx" ON "ConsultationFile" ("consultationId","kind","sortOrder");
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "ConsultationMessage" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "consultationId" TEXT NOT NULL,
  "authorType" "ConsultationMessageAuthorType" NOT NULL,

  "authorDoctorId" TEXT,
  "authorTelegramId" TEXT,

  "body" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT "ConsultationMessage_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationMessage_consultationId_fkey') THEN
    ALTER TABLE "ConsultationMessage"
      ADD CONSTRAINT "ConsultationMessage_consultationId_fkey"
      FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ConsultationMessage_authorDoctorId_fkey') THEN
    ALTER TABLE "ConsultationMessage"
      ADD CONSTRAINT "ConsultationMessage_authorDoctorId_fkey"
      FOREIGN KEY ("authorDoctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationMessage_consultationId_idx') THEN
    CREATE INDEX "ConsultationMessage_consultationId_idx" ON "ConsultationMessage" ("consultationId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationMessage_authorDoctorId_idx') THEN
    CREATE INDEX "ConsultationMessage_authorDoctorId_idx" ON "ConsultationMessage" ("authorDoctorId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationMessage_authorTelegramId_idx') THEN
    CREATE INDEX "ConsultationMessage_authorTelegramId_idx" ON "ConsultationMessage" ("authorTelegramId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'ConsultationMessage_consultationId_createdAt_idx') THEN
    CREATE INDEX "ConsultationMessage_consultationId_createdAt_idx" ON "ConsultationMessage" ("consultationId","createdAt");
  END IF;
END$$;

-- ===========================
-- 4) Thanks
-- ===========================

CREATE TABLE IF NOT EXISTS "Thanks" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Thanks_doctorId_fkey') THEN
    ALTER TABLE "Thanks"
      ADD CONSTRAINT "Thanks_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Thanks_paymentId_key') THEN
    ALTER TABLE "Thanks"
      ADD CONSTRAINT "Thanks_paymentId_key" UNIQUE ("paymentId");
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Thanks_doctorId_idx') THEN
    CREATE INDEX "Thanks_doctorId_idx" ON "Thanks" ("doctorId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Thanks_doctorId_createdAt_idx') THEN
    CREATE INDEX "Thanks_doctorId_createdAt_idx" ON "Thanks" ("doctorId","createdAt");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Thanks_authorTelegramId_idx') THEN
    CREATE INDEX "Thanks_authorTelegramId_idx" ON "Thanks" ("authorTelegramId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Thanks_status_idx') THEN
    CREATE INDEX "Thanks_status_idx" ON "Thanks" ("status");
  END IF;
END$$;
