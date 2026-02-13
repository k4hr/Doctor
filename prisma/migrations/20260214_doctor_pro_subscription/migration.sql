-- prisma/migrations/20260214_doctor_pro_subscription/migration.sql

BEGIN;

-- 1) Doctor: поле proUntil (быстрый флаг PRO)
ALTER TABLE "Doctor"
  ADD COLUMN IF NOT EXISTS "proUntil" TIMESTAMP(3);

-- индекс по proUntil (быстро: proUntil > now())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Doctor_proUntil_idx'
  ) THEN
    CREATE INDEX "Doctor_proUntil_idx" ON "Doctor" ("proUntil");
  END IF;
END$$;

-- 2) Enum: план подписки
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DoctorProPlan') THEN
    CREATE TYPE "DoctorProPlan" AS ENUM ('M1', 'M3', 'M6', 'Y1');
  END IF;
END$$;

-- 3) Enum: статус подписки
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DoctorProStatus') THEN
    CREATE TYPE "DoctorProStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED', 'REFUNDED');
  END IF;
END$$;

-- 4) Таблица DoctorProSubscription
CREATE TABLE IF NOT EXISTS "DoctorProSubscription" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "doctorId" TEXT NOT NULL,

  "status" "DoctorProStatus" NOT NULL DEFAULT 'ACTIVE',
  "plan"   "DoctorProPlan"   NOT NULL,

  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt"   TIMESTAMP(3) NOT NULL,

  "priceRub" INTEGER NOT NULL DEFAULT 199,

  "provider"  TEXT,
  "paymentId" TEXT,

  "canceledAt" TIMESTAMP(3),
  "meta" JSONB,

  CONSTRAINT "DoctorProSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DoctorProSubscription_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- updatedAt авто-апдейт (как prisma @updatedAt)
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "DoctorProSubscription_set_updatedAt" ON "DoctorProSubscription";
CREATE TRIGGER "DoctorProSubscription_set_updatedAt"
BEFORE UPDATE ON "DoctorProSubscription"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- paymentId уникальный, но разрешаем NULL (в PG NULL не конфликтует)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'DoctorProSubscription_paymentId_key'
  ) THEN
    CREATE UNIQUE INDEX "DoctorProSubscription_paymentId_key"
      ON "DoctorProSubscription" ("paymentId");
  END IF;
END$$;

-- индексы для выборок
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'DoctorProSubscription_doctorId_idx'
  ) THEN
    CREATE INDEX "DoctorProSubscription_doctorId_idx"
      ON "DoctorProSubscription" ("doctorId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'DoctorProSubscription_doctorId_status_idx'
  ) THEN
    CREATE INDEX "DoctorProSubscription_doctorId_status_idx"
      ON "DoctorProSubscription" ("doctorId", "status");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'DoctorProSubscription_status_idx'
  ) THEN
    CREATE INDEX "DoctorProSubscription_status_idx"
      ON "DoctorProSubscription" ("status");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'DoctorProSubscription_endsAt_idx'
  ) THEN
    CREATE INDEX "DoctorProSubscription_endsAt_idx"
      ON "DoctorProSubscription" ("endsAt");
  END IF;
END$$;

COMMIT;
