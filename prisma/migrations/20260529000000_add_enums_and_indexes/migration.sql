-- CreateEnum
CREATE TYPE "Species" AS ENUM ('cattle', 'sheep', 'goat');

-- CreateEnum
CREATE TYPE "AnimalSex" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'operator');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "AiProfileId" AS ENUM ('essential', 'brief', 'standard', 'expert');

-- AlterTable: convert TEXT columns to enum types
ALTER TABLE "Animal"
  ALTER COLUMN "species" TYPE "Species" USING "species"::"Species",
  ALTER COLUMN "sex"     TYPE "AnimalSex" USING "sex"::"AnimalSex";

ALTER TABLE "Farm"
  ALTER COLUMN "aiProfile" TYPE "AiProfileId" USING "aiProfile"::"AiProfileId";

ALTER TABLE "farm_members"
  ALTER COLUMN "role" TYPE "MemberRole" USING "role"::"MemberRole";

ALTER TABLE "farm_invitations"
  ALTER COLUMN "role"   TYPE "MemberRole" USING "role"::"MemberRole",
  ALTER COLUMN "status" TYPE "InvitationStatus" USING "status"::"InvitationStatus";

ALTER TABLE "Breeder"
  ALTER COLUMN "species" TYPE "Species" USING "species"::"Species";

ALTER TABLE "Prediction"
  ALTER COLUMN "aiProfile" TYPE "AiProfileId" USING "aiProfile"::"AiProfileId";

-- CreateIndex (missing from initial migration)
CREATE UNIQUE INDEX "Animal_farmId_identifier_key" ON "Animal"("farmId", "identifier");

CREATE INDEX "Animal_farmId_active_idx"   ON "Animal"("farmId", "active");
CREATE INDEX "Animal_farmId_species_idx"  ON "Animal"("farmId", "species");
CREATE INDEX "Weighing_animalId_weighingDate_idx" ON "Weighing"("animalId", "weighingDate");
CREATE INDEX "Breeder_farmId_active_species_idx"  ON "Breeder"("farmId", "active", "species");
CREATE INDEX "ReproductiveEvent_animalId_eventDate_idx" ON "ReproductiveEvent"("animalId", "eventDate");
CREATE INDEX "Prediction_animalId_createdAt_idx"  ON "Prediction"("animalId", "createdAt");
CREATE INDEX "FarmInvitation_farmId_status_idx"   ON "farm_invitations"("farmId", "status");
