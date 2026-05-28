-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "averagePregnancyRate" INTEGER NOT NULL DEFAULT 0,
    "aiProfile" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "lineage" TEXT,
    "sex" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "reproductiveStatus" TEXT NOT NULL DEFAULT 'Ready',
    "producer" TEXT,
    "photoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pregnancyHistory" INTEGER NOT NULL DEFAULT 0,
    "abortionCount" INTEGER NOT NULL DEFAULT 0,
    "birthCount" INTEGER NOT NULL DEFAULT 0,
    "heatDetectionCount" INTEGER NOT NULL DEFAULT 0,
    "averageBirthInterval" INTEGER NOT NULL DEFAULT 0,
    "lastBirthDate" TIMESTAMP(3),
    "bodyConditionScore" INTEGER NOT NULL DEFAULT 3,
    "reproductiveDiseaseHistory" BOOLEAN NOT NULL DEFAULT false,
    "birthWeight" DOUBLE PRECISION,
    "preWeaningWeightGain" DOUBLE PRECISION,
    "weaningWeight" DOUBLE PRECISION,
    "farmId" TEXT NOT NULL,
    "sireId" TEXT,
    "damId" TEXT,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weighing" (
    "id" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "weighingDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" TEXT NOT NULL,

    CONSTRAINT "Weighing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breeder" (
    "id" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "fertilityScore" INTEGER NOT NULL DEFAULT 0,
    "estimatedScore" INTEGER NOT NULL DEFAULT 0,
    "totalInseminations" INTEGER NOT NULL DEFAULT 0,
    "pregnancies" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "farmId" TEXT NOT NULL,
    "animalId" TEXT,

    CONSTRAINT "Breeder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReproductiveEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "inseminator" TEXT,
    "semenUsed" TEXT,
    "lot" TEXT,
    "reproductiveProtocol" TEXT,
    "pregnancyDiagnosis" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "confirmationDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" TEXT NOT NULL,
    "breederId" TEXT,

    CONSTRAINT "ReproductiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "pregnancyProbability" INTEGER NOT NULL,
    "fertilityScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "geneticCompatibility" INTEGER,
    "positiveFactors" TEXT[],
    "alerts" TEXT[],
    "recommendations" TEXT[],
    "aiInsight" TEXT,
    "protocol" TEXT,
    "ambientTemperature" DOUBLE PRECISION,
    "season" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiProfile" TEXT NOT NULL DEFAULT 'standard',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "analysisType" TEXT NOT NULL DEFAULT 'pregnancy',
    "animalId" TEXT,
    "breederId" TEXT,
    "reproductiveEventId" TEXT,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_members" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "farmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "farm_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "farmId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,

    CONSTRAINT "farm_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Breeder_animalId_key" ON "Breeder"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_reproductiveEventId_key" ON "Prediction"("reproductiveEventId");

-- CreateIndex
CREATE UNIQUE INDEX "farm_members_farmId_userId_key" ON "farm_members"("farmId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "farm_invitations_token_key" ON "farm_invitations"("token");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_sireId_fkey" FOREIGN KEY ("sireId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_damId_fkey" FOREIGN KEY ("damId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weighing" ADD CONSTRAINT "Weighing_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeder" ADD CONSTRAINT "Breeder_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeder" ADD CONSTRAINT "Breeder_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReproductiveEvent" ADD CONSTRAINT "ReproductiveEvent_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReproductiveEvent" ADD CONSTRAINT "ReproductiveEvent_breederId_fkey" FOREIGN KEY ("breederId") REFERENCES "Breeder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_breederId_fkey" FOREIGN KEY ("breederId") REFERENCES "Breeder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_reproductiveEventId_fkey" FOREIGN KEY ("reproductiveEventId") REFERENCES "ReproductiveEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_invitations" ADD CONSTRAINT "farm_invitations_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_invitations" ADD CONSTRAINT "farm_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

