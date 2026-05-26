-- DropForeignKey
ALTER TABLE "Predicao" DROP CONSTRAINT "Predicao_animalId_fkey";

-- AlterTable
ALTER TABLE "Predicao" ADD COLUMN     "tipoAnalise" TEXT NOT NULL DEFAULT 'prenhez',
ALTER COLUMN "animalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Predicao" ADD CONSTRAINT "Predicao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
