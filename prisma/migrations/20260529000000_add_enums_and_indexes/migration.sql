-- CreateEnum
CREATE TYPE "Species" AS ENUM ('cattle', 'sheep', 'goat');
CREATE TYPE "AnimalSex" AS ENUM ('male', 'female');
CREATE TYPE "MemberRole" AS ENUM ('admin', 'operator');
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE "AiProfileId" AS ENUM ('essential', 'brief', 'standard', 'expert');

-- AlterTable Animal
ALTER TABLE "Animal"
  ALTER COLUMN "species" TYPE "Species" USING "species"::"Species",
  ALTER COLUMN "sex"     TYPE "AnimalSex" USING "sex"::"AnimalSex";

-- AlterTable Farm (drop default first, alter type, restore default)
ALTER TABLE "Farm" ALTER COLUMN "aiProfile" DROP DEFAULT;
ALTER TABLE "Farm" ALTER COLUMN "aiProfile" TYPE "AiProfileId" USING "aiProfile"::"AiProfileId";
ALTER TABLE "Farm" ALTER COLUMN "aiProfile" SET DEFAULT 'standard'::"AiProfileId";

-- AlterTable farm_members
ALTER TABLE "farm_members"
  ALTER COLUMN "role" TYPE "MemberRole" USING "role"::"MemberRole";

-- AlterTable farm_invitations (drop defaults first, alter types, restore defaults)
ALTER TABLE "farm_invitations" ALTER COLUMN "role" TYPE "MemberRole" USING "role"::"MemberRole";
ALTER TABLE "farm_invitations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "farm_invitations" ALTER COLUMN "status" TYPE "InvitationStatus" USING "status"::"InvitationStatus";
ALTER TABLE "farm_invitations" ALTER COLUMN "status" SET DEFAULT 'pending'::"InvitationStatus";

-- AlterTable Breeder
ALTER TABLE "Breeder"
  ALTER COLUMN "species" TYPE "Species" USING "species"::"Species";

-- AlterTable Prediction (drop default first, alter type, restore default)
ALTER TABLE "Prediction" ALTER COLUMN "aiProfile" DROP DEFAULT;
ALTER TABLE "Prediction" ALTER COLUMN "aiProfile" TYPE "AiProfileId" USING "aiProfile"::"AiProfileId";
ALTER TABLE "Prediction" ALTER COLUMN "aiProfile" SET DEFAULT 'standard'::"AiProfileId";

-- CreateIndex
CREATE UNIQUE INDEX "Animal_farmId_identifier_key" ON "Animal"("farmId", "identifier");
CREATE INDEX "Animal_farmId_active_idx"                    ON "Animal"("farmId", "active");
CREATE INDEX "Animal_farmId_species_idx"                   ON "Animal"("farmId", "species");
CREATE INDEX "Weighing_animalId_weighingDate_idx"          ON "Weighing"("animalId", "weighingDate");
CREATE INDEX "Breeder_farmId_active_species_idx"           ON "Breeder"("farmId", "active", "species");
CREATE INDEX "ReproductiveEvent_animalId_eventDate_idx"    ON "ReproductiveEvent"("animalId", "eventDate");
CREATE INDEX "Prediction_animalId_createdAt_idx"           ON "Prediction"("animalId", "createdAt");
CREATE INDEX "FarmInvitation_farmId_status_idx"            ON "farm_invitations"("farmId", "status");
