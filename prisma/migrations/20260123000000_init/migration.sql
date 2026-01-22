-- CreateEnum
CREATE TYPE "DoctorStatus" AS ENUM ('DRAFT', 'PENDING', 'NEED_FIX', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DoctorFileKind" AS ENUM ('PROFILE_PHOTO', 'DIPLOMA_PHOTO');

-- CreateTable
CREATE TABLE "Doctor" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "status" "DoctorStatus" NOT NULL DEFAULT 'DRAFT',

  "telegramId" TEXT NOT NULL,
  "telegramUsername" TEXT,
  "telegramFirstName" TEXT,
  "telegramLastName" TEXT,

  "lastName" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "gender" TEXT NOT NULL,
  "birthDay" INTEGER,
  "birthMonth" INTEGER,
  "birthYear" INTEGER,
  "city" TEXT,

  "speciality1" TEXT NOT NULL,
  "speciality2" TEXT,
  "speciality3" TEXT,
  "education" TEXT NOT NULL,
  "degree" TEXT,
  "workplace" TEXT,
  "position" TEXT,
  "experienceYears" INTEGER NOT NULL,
  "awards" TEXT,

  "email" TEXT NOT NULL,

  "about" TEXT NOT NULL,
  "specialityDetails" TEXT NOT NULL,
  "experienceDetails" TEXT NOT NULL,
  "courses" TEXT,
  "achievements" TEXT,
  "publications" TEXT,

  CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_telegramId_key" ON "Doctor"("telegramId");

-- CreateIndex
CREATE INDEX "Doctor_status_idx" ON "Doctor"("status");

-- CreateIndex
CREATE INDEX "Doctor_speciality1_idx" ON "Doctor"("speciality1");

-- CreateIndex
CREATE INDEX "Doctor_city_idx" ON "Doctor"("city");

-- CreateIndex
CREATE INDEX "Doctor_submittedAt_idx" ON "Doctor"("submittedAt");

-- CreateTable
CREATE TABLE "DoctorFile" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  "doctorId" TEXT NOT NULL,
  "kind" "DoctorFileKind" NOT NULL,
  "url" TEXT NOT NULL,
  "mime" TEXT,
  "sizeBytes" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "DoctorFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DoctorFile"
ADD CONSTRAINT "DoctorFile_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "DoctorFile_doctorId_idx" ON "DoctorFile"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorFile_kind_idx" ON "DoctorFile"("kind");

-- CreateIndex
CREATE INDEX "DoctorFile_doctorId_kind_idx" ON "DoctorFile"("doctorId", "kind");

-- CreateIndex
CREATE INDEX "DoctorFile_doctorId_kind_sortOrder_idx" ON "DoctorFile"("doctorId", "kind", "sortOrder");
