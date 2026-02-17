-- prisma/migrations/20260217_consultations_and_thanks_cleanup/migration.sql
BEGIN;

-- 1) Сносим таблицы (CASCADE уберёт FK/зависимости)
DROP TABLE IF EXISTS "ConsultationMessage" CASCADE;
DROP TABLE IF EXISTS "ConsultationFile" CASCADE;
DROP TABLE IF EXISTS "Consultation" CASCADE;
DROP TABLE IF EXISTS "Thanks" CASCADE;

-- 2) Сносим enum-типы (если остались)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationMessageAuthorType') THEN
    DROP TYPE "ConsultationMessageAuthorType";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationFileKind') THEN
    DROP TYPE "ConsultationFileKind";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationStatus') THEN
    DROP TYPE "ConsultationStatus";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ThanksStatus') THEN
    DROP TYPE "ThanksStatus";
  END IF;
END$$;

COMMIT;
