BEGIN;

ALTER TABLE "Consultation"
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'Consultation_paidAt_idx'
  ) THEN
    CREATE INDEX "Consultation_paidAt_idx" ON "Consultation" ("paidAt");
  END IF;
END$$;

COMMIT;
