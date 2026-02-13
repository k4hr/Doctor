/* path: prisma/migrations/202602130002_add_question_edit_fields/migration.sql */

-- 1) Question: add editCount + editedAt
-- Prisma schema:
-- editCount Int @default(0)
-- editedAt  DateTime?

ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "editCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);

-- на всякий случай (если вдруг когда-то было nullable/битые данные)
UPDATE "Question"
SET "editCount" = 0
WHERE "editCount" IS NULL;
