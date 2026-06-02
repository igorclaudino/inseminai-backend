-- Drop FK constraints from Breeder
ALTER TABLE "ReproductiveEvent" DROP CONSTRAINT IF EXISTS "ReproductiveEvent_breederId_fkey";
ALTER TABLE "Prediction"        DROP CONSTRAINT IF EXISTS "Prediction_breederId_fkey";

-- NULL out old Breeder IDs (they are not Animal IDs)
UPDATE "ReproductiveEvent" SET "breederId" = NULL;
UPDATE "Prediction"        SET "breederId" = NULL;

-- Rename columns breederId → sireId
ALTER TABLE "ReproductiveEvent" RENAME COLUMN "breederId" TO "sireId";
ALTER TABLE "Prediction"        RENAME COLUMN "breederId" TO "sireId";

-- Add FK constraints to Animal
ALTER TABLE "ReproductiveEvent" ADD CONSTRAINT "ReproductiveEvent_sireId_fkey"
  FOREIGN KEY ("sireId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_sireId_fkey"
  FOREIGN KEY ("sireId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add sire performance columns to Animal
ALTER TABLE "Animal" ADD COLUMN "fertilityScore"       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Animal" ADD COLUMN "totalInseminations"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Animal" ADD COLUMN "pregnanciesAsBreeder" INTEGER NOT NULL DEFAULT 0;

-- Drop Breeder table (FKs already removed above)
DROP TABLE IF EXISTS "Breeder";
