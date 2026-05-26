-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fazenda" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "municipio" TEXT,
    "estado" TEXT,
    "taxaMediaPrenhez" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perfilIa" TEXT NOT NULL DEFAULT 'padrao',
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Fazenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "raca" TEXT NOT NULL,
    "linhagem" TEXT,
    "sexo" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "statusReproducao" TEXT NOT NULL DEFAULT 'Apto',
    "produtor" TEXT,
    "fotoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "historicoPrenhez" INTEGER NOT NULL DEFAULT 0,
    "quantidadeAbortos" INTEGER NOT NULL DEFAULT 0,
    "quantidadePartos" INTEGER NOT NULL DEFAULT 0,
    "quantidadeCiosDetectados" INTEGER NOT NULL DEFAULT 0,
    "intervaloMedioPartos" INTEGER NOT NULL DEFAULT 0,
    "dataUltimoParto" TIMESTAMP(3),
    "scoreCondicaoCorporal" INTEGER NOT NULL DEFAULT 3,
    "historicoDoencaReprodutiva" BOOLEAN NOT NULL DEFAULT false,
    "pesoNascer" DOUBLE PRECISION,
    "ganhoPesoPreDesmame" DOUBLE PRECISION,
    "pesoDesmame" DOUBLE PRECISION,
    "fazendaId" TEXT NOT NULL,
    "paiId" TEXT,
    "maeId" TEXT,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesagem" (
    "id" TEXT NOT NULL,
    "pesoKg" DOUBLE PRECISION NOT NULL,
    "dataPesagem" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" TEXT NOT NULL,

    CONSTRAINT "Pesagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reprodutor" (
    "id" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "raca" TEXT NOT NULL,
    "scoreFertilidade" INTEGER NOT NULL DEFAULT 0,
    "scoreEstimado" INTEGER NOT NULL DEFAULT 0,
    "totalInseminacoes" INTEGER NOT NULL DEFAULT 0,
    "prenhezes" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fazendaId" TEXT NOT NULL,
    "animalId" TEXT,

    CONSTRAINT "Reprodutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoReprodutivo" (
    "id" TEXT NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "inseminador" TEXT,
    "semenUtilizado" TEXT,
    "lote" TEXT,
    "protocoloReprodutivo" TEXT,
    "diagnosticoPrenhez" TEXT NOT NULL DEFAULT 'pendente',
    "resultado" TEXT,
    "dataEvento" TIMESTAMP(3) NOT NULL,
    "dataConfirmacao" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "animalId" TEXT NOT NULL,
    "reprodutorId" TEXT,

    CONSTRAINT "EventoReprodutivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Predicao" (
    "id" TEXT NOT NULL,
    "probabilidadePrenhez" INTEGER NOT NULL,
    "scoreFertilidade" INTEGER NOT NULL,
    "nivelRisco" TEXT NOT NULL,
    "compatibilidadeGenetica" INTEGER,
    "fatoresPositivos" TEXT[],
    "alertas" TEXT[],
    "recomendacoes" TEXT[],
    "insightGpt" TEXT,
    "protocolo" TEXT,
    "temperaturaAmbiente" DOUBLE PRECISION,
    "estacaoAno" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perfilIa" TEXT NOT NULL DEFAULT 'padrao',
    "tokensEntrada" INTEGER NOT NULL DEFAULT 0,
    "tokensSaida" INTEGER NOT NULL DEFAULT 0,
    "animalId" TEXT NOT NULL,
    "reprodutorId" TEXT,
    "eventoReprodutivoId" TEXT,

    CONSTRAINT "Predicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Reprodutor_animalId_key" ON "Reprodutor"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "Predicao_eventoReprodutivoId_key" ON "Predicao"("eventoReprodutivoId");

-- AddForeignKey
ALTER TABLE "Fazenda" ADD CONSTRAINT "Fazenda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_maeId_fkey" FOREIGN KEY ("maeId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesagem" ADD CONSTRAINT "Pesagem_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reprodutor" ADD CONSTRAINT "Reprodutor_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reprodutor" ADD CONSTRAINT "Reprodutor_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoReprodutivo" ADD CONSTRAINT "EventoReprodutivo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoReprodutivo" ADD CONSTRAINT "EventoReprodutivo_reprodutorId_fkey" FOREIGN KEY ("reprodutorId") REFERENCES "Reprodutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Predicao" ADD CONSTRAINT "Predicao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Predicao" ADD CONSTRAINT "Predicao_reprodutorId_fkey" FOREIGN KEY ("reprodutorId") REFERENCES "Reprodutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Predicao" ADD CONSTRAINT "Predicao_eventoReprodutivoId_fkey" FOREIGN KEY ("eventoReprodutivoId") REFERENCES "EventoReprodutivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
