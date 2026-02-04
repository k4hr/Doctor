/* path: prisma/migrations/202602050001_add_doctor_wallet/migration.sql */

-- 1) enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DoctorTxType') THEN
    CREATE TYPE "DoctorTxType" AS ENUM ('IN', 'OUT');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DoctorTxStatus') THEN
    CREATE TYPE "DoctorTxStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DoctorPayoutStatus') THEN
    CREATE TYPE "DoctorPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELED');
  END IF;
END$$;

-- 2) DoctorWallet
CREATE TABLE IF NOT EXISTS "DoctorWallet" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "doctorId" TEXT NOT NULL,
  "balanceRub" INTEGER NOT NULL DEFAULT 0,
  "pendingRub" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "DoctorWallet_pkey" PRIMARY KEY ("id")
);

-- unique 1:1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DoctorWallet_doctorId_key'
  ) THEN
    ALTER TABLE "DoctorWallet"
      ADD CONSTRAINT "DoctorWallet_doctorId_key" UNIQUE ("doctorId");
  END IF;
END$$;

-- FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DoctorWallet_doctorId_fkey'
  ) THEN
    ALTER TABLE "DoctorWallet"
      ADD CONSTRAINT "DoctorWallet_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "DoctorWallet_doctorId_idx" ON "DoctorWallet"("doctorId");

-- 3) DoctorPayoutRequest
CREATE TABLE IF NOT EXISTS "DoctorPayoutRequest" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "doctorId" TEXT NOT NULL,
  "amountRub" INTEGER NOT NULL,
  "status" "DoctorPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "details" JSONB,

  CONSTRAINT "DoctorPayoutRequest_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DoctorPayoutRequest_doctorId_fkey'
  ) THEN
    ALTER TABLE "DoctorPayoutRequest"
      ADD CONSTRAINT "DoctorPayoutRequest_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "DoctorPayoutRequest_doctorId_idx" ON "DoctorPayoutRequest"("doctorId");
CREATE INDEX IF NOT EXISTS "DoctorPayoutRequest_doctorId_createdAt_idx" ON "DoctorPayoutRequest"("doctorId", "createdAt");
CREATE INDEX IF NOT EXISTS "DoctorPayoutRequest_doctorId_status_createdAt_idx" ON "DoctorPayoutRequest"("doctorId", "status", "createdAt");

-- 4) DoctorTransaction
CREATE TABLE IF NOT EXISTS "DoctorTransaction" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "doctorId" TEXT NOT NULL,

  "type" "DoctorTxType" NOT NULL,
  "status" "DoctorTxStatus" NOT NULL DEFAULT 'PENDING',

  "amountRub" INTEGER NOT NULL,
  "title" TEXT,
  "meta" JSONB,

  "payoutId" TEXT,

  CONSTRAINT "DoctorTransaction_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DoctorTransaction_doctorId_fkey'
  ) THEN
    ALTER TABLE "DoctorTransaction"
      ADD CONSTRAINT "DoctorTransaction_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- ✅ для связи 1:1 payout.transaction
-- (уникальный payoutId, null допускается многократно в Postgres)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DoctorTransaction_payoutId_key'
  ) THEN
    ALTER TABLE "DoctorTransaction"
      ADD CONSTRAINT "DoctorTransaction_payoutId_key" UNIQUE ("payoutId");
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DoctorTransaction_payoutId_fkey'
  ) THEN
    ALTER TABLE "DoctorTransaction"
      ADD CONSTRAINT "DoctorTransaction_payoutId_fkey"
      FOREIGN KEY ("payoutId") REFERENCES "DoctorPayoutRequest"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "DoctorTransaction_doctorId_idx" ON "DoctorTransaction"("doctorId");
CREATE INDEX IF NOT EXISTS "DoctorTransaction_doctorId_createdAt_idx" ON "DoctorTransaction"("doctorId", "createdAt");
CREATE INDEX IF NOT EXISTS "DoctorTransaction_doctorId_type_createdAt_idx" ON "DoctorTransaction"("doctorId", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "DoctorTransaction_doctorId_status_createdAt_idx" ON "DoctorTransaction"("doctorId", "status", "createdAt");
