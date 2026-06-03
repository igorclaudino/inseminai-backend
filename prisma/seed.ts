import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Iniciando seed de dados para demo...\n');

  // ─── Limpeza: apaga dados da fazenda demo para garantir estado inicial limpo ──
  console.log('🧹 Limpando dados anteriores da conta demo...');
  const existingUser = await prisma.user.findUnique({ where: { email: 'demo@insemiai.com.br' } });
  if (existingUser) {
    const membership = await prisma.farmMember.findFirst({ where: { userId: existingUser.id } });
    if (membership) {
      const fId = membership.farmId;
      await prisma.prediction.deleteMany({ where: { animal: { farmId: fId } } });
      await prisma.reproductiveEvent.deleteMany({ where: { animal: { farmId: fId } } });
      await prisma.weighing.deleteMany({ where: { animal: { farmId: fId } } });
      await prisma.farmMember.deleteMany({ where: { farmId: fId } });
      await prisma.farmInvitation.deleteMany({ where: { farmId: fId } });
      await prisma.animal.deleteMany({ where: { farmId: fId } });
      await prisma.farm.delete({ where: { id: fId } });
    }
    await prisma.user.delete({ where: { id: existingUser.id } });
  }
  console.log('✅ Limpeza concluída.\n');

  // ─── Usuário ──────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('Demo@2026', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Admin Demo',
      email: 'demo@insemiai.com.br',
      password,
    },
  });

  // ─── Fazenda ──────────────────────────────────────────────────────────────────
  const farm = await prisma.farm.create({
    data: {
      name: 'Fazenda Uruguai',
      city: 'Crateús',
      state: 'CE',
      averagePregnancyRate: 68,
      ownerId: user.id,
      aiProfile: 'standard',
    },
  });
  await prisma.farmMember.create({
    data: { farmId: farm.id, userId: user.id, role: 'admin' },
  });
  const farmId = farm.id;

  // ─── REPRODUTORES BOVINOS (3 machos — para ranking meaningful) ────────────────
  const bumba = await prisma.animal.create({
    data: {
      id: 'sire-bumba-0005',
      identifier: '0005', name: 'Bumbá', species: 'cattle', sex: 'male',
      breed: 'Nelore', lineage: 'Boi do Sertão', birthDate: new Date('2017-03-10'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready',
      fertilityScore: 88, totalInseminations: 24, pregnanciesAsBreeder: 19,
      birthWeight: 36.0, producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 620, weighingDate: daysAgo(180) },
        { weightKg: 635, weighingDate: daysAgo(60) },
        { weightKg: 641, weighingDate: daysAgo(10) },
      ]},
    },
  });

  const barao = await prisma.animal.create({
    data: {
      id: 'sire-barao-0006',
      identifier: '0006', name: 'Barão', species: 'cattle', sex: 'male',
      breed: 'Brahman', birthDate: new Date('2016-07-22'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready',
      fertilityScore: 73, totalInseminations: 15, pregnanciesAsBreeder: 10,
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 580, weighingDate: daysAgo(120) },
        { weightKg: 592, weighingDate: daysAgo(15) },
      ]},
    },
  });

  const trovao = await prisma.animal.create({
    data: {
      id: 'sire-trovao-0009',
      identifier: '0009', name: 'Trovão', species: 'cattle', sex: 'male',
      breed: 'Nelore', lineage: 'Linhagem Lemgruber', birthDate: new Date('2019-05-18'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready',
      fertilityScore: 82, totalInseminations: 12, pregnanciesAsBreeder: 9,
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 560, weighingDate: daysAgo(90) },
        { weightKg: 574, weighingDate: daysAgo(12) },
      ]},
    },
  });

  // ─── REPRODUTORES OVINOS (2 machos) ──────────────────────────────────────────
  const carneiro42 = await prisma.animal.create({
    data: {
      id: 'sire-carneiro-0007',
      identifier: '0007', name: 'Carneiro 42', species: 'sheep', sex: 'male',
      breed: 'Dorper', birthDate: new Date('2019-01-15'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready',
      fertilityScore: 85, totalInseminations: 18, pregnanciesAsBreeder: 15,
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 95, weighingDate: daysAgo(60) },
        { weightKg: 98, weighingDate: daysAgo(8) },
      ]},
    },
  });

  const farao = await prisma.animal.create({
    data: {
      id: 'sire-farao-0013',
      identifier: '0013', name: 'Faraó', species: 'sheep', sex: 'male',
      breed: 'Ile de France', birthDate: new Date('2020-08-10'),
      bodyConditionScore: 3, reproductiveStatus: 'Ready',
      fertilityScore: 78, totalInseminations: 10, pregnanciesAsBreeder: 7,
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 88, weighingDate: daysAgo(45) },
        { weightKg: 90, weighingDate: daysAgo(9) },
      ]},
    },
  });

  // ─── REPRODUTORES CAPRINOS (2 machos) ────────────────────────────────────────
  const kingBoer = await prisma.animal.create({
    data: {
      id: 'sire-king-boer-0008',
      identifier: '0008', name: 'King Boer', species: 'goat', sex: 'male',
      breed: 'Boer', birthDate: new Date('2018-06-10'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready',
      fertilityScore: 86, totalInseminations: 20, pregnanciesAsBreeder: 16,
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 72, weighingDate: daysAgo(90) },
        { weightKg: 75, weighingDate: daysAgo(10) },
      ]},
    },
  });

  const zeusBoer = await prisma.animal.create({
    data: {
      id: 'sire-zeus-0014',
      identifier: '0014', name: 'Zeus', species: 'goat', sex: 'male',
      breed: 'Boer', birthDate: new Date('2020-03-22'),
      bodyConditionScore: 3, reproductiveStatus: 'Ready',
      fertilityScore: 79, totalInseminations: 8, pregnanciesAsBreeder: 6,
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 65, weighingDate: daysAgo(40) },
        { weightKg: 67, weighingDate: daysAgo(7) },
      ]},
    },
  });

  // ─── ANIMAIS DE GENEALOGIA ────────────────────────────────────────────────────
  const moeda = await prisma.animal.create({
    data: {
      id: 'dam-moeda-0010',
      identifier: '0010', name: 'Moeda', species: 'cattle', sex: 'female',
      breed: 'Nelore', birthDate: new Date('2018-05-15'),
      bodyConditionScore: 3, pregnancyHistory: 4, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });
  const florita = await prisma.animal.create({
    data: {
      id: 'dam-florita-0011',
      identifier: '0011', name: 'Florita', species: 'cattle', sex: 'female',
      breed: 'Nelore', birthDate: new Date('2019-11-20'),
      bodyConditionScore: 3, pregnancyHistory: 2, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });
  const canela = await prisma.animal.create({
    data: {
      id: 'dam-canela-0012',
      identifier: '0012', name: 'Canela', species: 'sheep', sex: 'female',
      breed: 'Santa Inês', birthDate: new Date('2019-04-10'),
      bodyConditionScore: 3, pregnancyHistory: 3, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });

  // ─── FÊMEAS BOVINAS ───────────────────────────────────────────────────────────

  // Mimosa — perfil ideal: ECC 4, 461 kg, 3 prenhezes, pós-parto 270 dias → CENÁRIO 1 (ao vivo)
  const mimosa = await prisma.animal.create({
    data: {
      id: 'animal-mimosa-0020',
      identifier: '0020', rfid: '12756', name: 'Mimosa',
      species: 'cattle', sex: 'female', breed: 'Nelore', lineage: 'Lemgruber',
      birthDate: new Date('2018-09-12'),
      sireId: bumba.id, damId: moeda.id,
      bodyConditionScore: 4, reproductiveDiseaseHistory: false,
      pregnancyHistory: 3, birthCount: 3, abortionCount: 0,
      lastBirthDate: daysAgo(270), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      birthWeight: 34.5, weaningWeight: 190.0, preWeaningWeightGain: 0.95,
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 380, weighingDate: daysAgo(540), notes: 'Pós-parto ciclo 2' },
        { weightKg: 410, weighingDate: daysAgo(365), notes: 'Controle anual' },
        { weightKg: 430, weighingDate: daysAgo(270), notes: 'Pós-parto ciclo 3' },
        { weightKg: 448, weighingDate: daysAgo(90), notes: 'Controle pré-protocolo' },
        { weightKg: 461, weighingDate: new Date('2026-05-22'), notes: 'Pesagem pré-IATF — excelente condição' },
      ]},
    },
  });

  // Garoa — inseminação pendente de diagnóstico (28 dias) → CENÁRIO 5: ciclo completo
  const garoa = await prisma.animal.create({
    data: {
      id: 'animal-garoa-0021',
      identifier: '0021', name: 'Garoa',
      species: 'cattle', sex: 'female', breed: 'Brahman',
      birthDate: new Date('2021-04-05'),
      sireId: barao.id, damId: florita.id,
      bodyConditionScore: 3, reproductiveDiseaseHistory: false,
      pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
      lastBirthDate: daysAgo(120), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 330, weighingDate: daysAgo(360), notes: 'Pesagem pós-parto 1' },
        { weightKg: 355, weighingDate: daysAgo(180), notes: 'Recuperação pós-parto' },
        { weightKg: 378, weighingDate: daysAgo(60), notes: 'Pré-protocolo' },
        { weightKg: 398, weighingDate: daysAgo(5), notes: 'Pré-IATF' },
      ]},
    },
  });

  // Arrepiada — prenhe (variedade de status)
  const arrepiada = await prisma.animal.create({
    data: {
      id: 'animal-arrepiada-0022',
      identifier: '0022', name: 'Arrepiada',
      species: 'cattle', sex: 'female', breed: 'Nelore',
      birthDate: new Date('2019-06-18'),
      bodyConditionScore: 4, reproductiveDiseaseHistory: false,
      pregnancyHistory: 3, birthCount: 3, abortionCount: 0,
      lastBirthDate: daysAgo(300), reproductiveStatus: 'Pregnant',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 400, weighingDate: daysAgo(300), notes: 'Pós-parto ciclo 3' },
        { weightKg: 430, weighingDate: daysAgo(120), notes: 'Pré-IATF' },
        { weightKg: 452, weighingDate: daysAgo(30), notes: 'Controle gestação' },
      ]},
    },
  });

  // Estrela — risco moderado: 1 aborto + pós-parto curto (40 dias) → CENÁRIO 2 (pré-feito)
  const estrela = await prisma.animal.create({
    data: {
      id: 'animal-estrela-0023',
      identifier: '0023', name: 'Estrela',
      species: 'cattle', sex: 'female', breed: 'Girolando',
      birthDate: new Date('2022-07-20'),
      bodyConditionScore: 3, reproductiveDiseaseHistory: false,
      pregnancyHistory: 1, birthCount: 1, abortionCount: 1,
      lastBirthDate: daysAgo(40), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 360, weighingDate: daysAgo(200), notes: 'Pré-protocolo ciclo 1' },
        { weightKg: 372, weighingDate: daysAgo(80), notes: 'Pós-parto' },
        { weightKg: 388, weighingDate: daysAgo(10), notes: 'Pré-protocolo ciclo 2' },
      ]},
    },
  });

  // Princesa — alto risco: ECC 2, aborto, pós-parto 45 dias (para best_dam mostrar contraste)
  const princesa = await prisma.animal.create({
    data: {
      id: 'animal-princesa-0024',
      identifier: '0024', name: 'Princesa',
      species: 'cattle', sex: 'female', breed: 'Angus',
      birthDate: new Date('2021-02-14'),
      bodyConditionScore: 2, reproductiveDiseaseHistory: true,
      pregnancyHistory: 1, birthCount: 1, abortionCount: 2,
      lastBirthDate: daysAgo(45), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 340, weighingDate: daysAgo(180), notes: 'Perda de peso progressiva' },
        { weightKg: 328, weighingDate: daysAgo(60) },
        { weightKg: 332, weighingDate: daysAgo(8), notes: 'Peso abaixo do ideal — suplementação iniciada' },
      ]},
    },
  });

  // Bela — perfil intermediário: ECC 3, 1 prenhez, pós-parto 90 dias
  const bela = await prisma.animal.create({
    data: {
      id: 'animal-bela-0025',
      identifier: '0025', name: 'Bela',
      species: 'cattle', sex: 'female', breed: 'Sindi',
      birthDate: new Date('2020-11-08'),
      bodyConditionScore: 3, reproductiveDiseaseHistory: false,
      pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
      lastBirthDate: daysAgo(90), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 350, weighingDate: daysAgo(270) },
        { weightKg: 368, weighingDate: daysAgo(120) },
        { weightKg: 382, weighingDate: daysAgo(7), notes: 'Pré-protocolo' },
      ]},
    },
  });

  // ─── FÊMEAS OVINAS ────────────────────────────────────────────────────────────

  // Branca — perfil ideal: ECC 4, 52 kg, 2 prenhezes → CENÁRIO 3 (ao vivo)
  const branca = await prisma.animal.create({
    data: {
      id: 'animal-branca-0030',
      identifier: '0030', name: 'Branca',
      species: 'sheep', sex: 'female', breed: 'Santa Inês',
      birthDate: new Date('2022-01-10'),
      sireId: carneiro42.id, damId: canela.id,
      bodyConditionScore: 4, reproductiveDiseaseHistory: false,
      pregnancyHistory: 2, birthCount: 2, abortionCount: 0,
      lastBirthDate: daysAgo(95), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      birthWeight: 4.2, weaningWeight: 22.0, preWeaningWeightGain: 0.24,
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 42, weighingDate: daysAgo(360), notes: 'Pós-parto ciclo 1' },
        { weightKg: 46, weighingDate: daysAgo(240), notes: 'Controle' },
        { weightKg: 48, weighingDate: daysAgo(120), notes: 'Pós-parto ciclo 2' },
        { weightKg: 50, weighingDate: daysAgo(40), notes: 'Recuperação pós-parto' },
        { weightKg: 52, weighingDate: daysAgo(8), notes: 'Pré-IATF — ótima condição' },
      ]},
    },
  });

  // Serena — alto risco: ECC 2, pós-parto 35 dias, baixo peso (pré-feito)
  const serena = await prisma.animal.create({
    data: {
      id: 'animal-serena-0031',
      identifier: '0031', name: 'Serena',
      species: 'sheep', sex: 'female', breed: 'Morada Nova',
      birthDate: new Date('2021-08-20'),
      bodyConditionScore: 2, reproductiveDiseaseHistory: false,
      pregnancyHistory: 2, birthCount: 2, abortionCount: 1,
      lastBirthDate: daysAgo(35), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 44, weighingDate: daysAgo(200) },
        { weightKg: 41, weighingDate: daysAgo(80), notes: 'Perda de peso pós-parto' },
        { weightKg: 37, weighingDate: daysAgo(6), notes: 'Baixo peso — requer suplementação urgente' },
      ]},
    },
  });

  // Luna — nulípara jovem, ECC 4, bom peso → moderada
  const luna = await prisma.animal.create({
    data: {
      id: 'animal-luna-0032',
      identifier: '0032', name: 'Luna',
      species: 'sheep', sex: 'female', breed: 'Dorper',
      birthDate: new Date('2024-03-15'),
      bodyConditionScore: 4, reproductiveDiseaseHistory: false,
      pregnancyHistory: 0, birthCount: 0, abortionCount: 0,
      reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 40, weighingDate: daysAgo(60), notes: 'Primeira pesagem pós-desmame' },
        { weightKg: 45, weighingDate: daysAgo(20), notes: 'Ganho de peso satisfatório' },
        { weightKg: 48, weighingDate: daysAgo(4), notes: 'Pré-protocolo — peso adequado para primeira IATF' },
      ]},
    },
  });

  // Antônia — risco moderado: ECC 3, 1 prenhez, 1 aborto, pós-parto 55 dias
  const antonia = await prisma.animal.create({
    data: {
      id: 'animal-antonia-0033',
      identifier: '0033', name: 'Antônia',
      species: 'sheep', sex: 'female', breed: 'Santa Inês',
      birthDate: new Date('2021-06-05'),
      bodyConditionScore: 3, reproductiveDiseaseHistory: false,
      pregnancyHistory: 1, birthCount: 1, abortionCount: 1,
      lastBirthDate: daysAgo(55), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 46, weighingDate: daysAgo(180) },
        { weightKg: 44, weighingDate: daysAgo(55), notes: 'Pós-parto' },
        { weightKg: 46, weighingDate: daysAgo(5), notes: 'Recuperação adequada' },
      ]},
    },
  });

  // ─── FÊMEAS CAPRINAS ──────────────────────────────────────────────────────────

  // Nuvem — perfil ideal: ECC 4, 40 kg, 2 partos, 80 dias pós-parto → CENÁRIO 4 (ao vivo)
  const nuvem = await prisma.animal.create({
    data: {
      id: 'animal-nuvem-0040',
      identifier: '0040', name: 'Nuvem',
      species: 'goat', sex: 'female', breed: 'Boer',
      birthDate: new Date('2022-04-05'),
      bodyConditionScore: 4, reproductiveDiseaseHistory: false,
      pregnancyHistory: 2, birthCount: 2, abortionCount: 0,
      lastBirthDate: daysAgo(80), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      birthWeight: 3.8, weaningWeight: 18.0, preWeaningWeightGain: 0.19,
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 32, weighingDate: daysAgo(360), notes: 'Pós-parto ciclo 1' },
        { weightKg: 35, weighingDate: daysAgo(240) },
        { weightKg: 36, weighingDate: daysAgo(90), notes: 'Pós-parto ciclo 2' },
        { weightKg: 38, weighingDate: daysAgo(40) },
        { weightKg: 40, weighingDate: daysAgo(5), notes: 'Pré-IATF — excelente recuperação' },
      ]},
    },
  });

  // Flor — moderado: ECC 3, 1 aborto, pós-parto 70 dias
  const flor = await prisma.animal.create({
    data: {
      id: 'animal-flor-0041',
      identifier: '0041', name: 'Flor',
      species: 'goat', sex: 'female', breed: 'Anglonubiana',
      birthDate: new Date('2022-08-12'),
      bodyConditionScore: 3, reproductiveDiseaseHistory: false,
      pregnancyHistory: 1, birthCount: 1, abortionCount: 1,
      lastBirthDate: daysAgo(70), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 34, weighingDate: daysAgo(180) },
        { weightKg: 35, weighingDate: daysAgo(70), notes: 'Pós-parto' },
        { weightKg: 37, weighingDate: daysAgo(7) },
      ]},
    },
  });

  // Rosa — alto risco: ECC 2, doença reprodutiva, baixo peso (pré-feito)
  const rosa = await prisma.animal.create({
    data: {
      id: 'animal-rosa-0042',
      identifier: '0042', name: 'Rosa',
      species: 'goat', sex: 'female', breed: 'Canindé',
      birthDate: new Date('2021-12-20'),
      bodyConditionScore: 2, reproductiveDiseaseHistory: true,
      pregnancyHistory: 0, birthCount: 0, abortionCount: 1,
      reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 32, weighingDate: daysAgo(180), notes: 'Peso inicial — abaixo do ideal' },
        { weightKg: 30, weighingDate: daysAgo(60), notes: 'Perda de peso — investigar causa' },
        { weightKg: 28, weighingDate: daysAgo(4), notes: 'Peso 20% abaixo do mínimo — intervenção necessária' },
      ]},
    },
  });

  // Safira — intermediária: ECC 3, nulípara adulta, bom peso
  const safira = await prisma.animal.create({
    data: {
      id: 'animal-safira-0043',
      identifier: '0043', name: 'Safira',
      species: 'goat', sex: 'female', breed: 'Anglo-nubiana',
      birthDate: new Date('2022-10-18'),
      bodyConditionScore: 3, reproductiveDiseaseHistory: false,
      pregnancyHistory: 0, birthCount: 0, abortionCount: 0,
      reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: { create: [
        { weightKg: 33, weighingDate: daysAgo(90) },
        { weightKg: 35, weighingDate: daysAgo(30), notes: 'Ganho de peso regular' },
        { weightKg: 36, weighingDate: daysAgo(6) },
      ]},
    },
  });

  // ─── EVENTOS REPRODUTIVOS ─────────────────────────────────────────────────────

  // BOVINOS
  await prisma.reproductiveEvent.createMany({
    skipDuplicates: true,
    data: [
      { id: 'evt-mimosa-iatf-1', animalId: mimosa.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-102', lot: 'Lote 03 - Vacas Selecionadas', reproductiveProtocol: 'IATF', eventDate: daysAgo(720), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(690) },
      { id: 'evt-mimosa-parto-1', animalId: mimosa.id, eventType: 'birth', eventDate: daysAgo(540), pregnancyDiagnosis: 'positive', result: 'Parto normal, bezerra fêmea' },
      { id: 'evt-mimosa-iatf-2', animalId: mimosa.id, sireId: trovao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore LEM-01', lot: 'Lote 04 - Matrizes Selecionadas', reproductiveProtocol: 'IATF', eventDate: daysAgo(450), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(420) },
      { id: 'evt-mimosa-parto-2', animalId: mimosa.id, eventType: 'birth', eventDate: daysAgo(270), pregnancyDiagnosis: 'positive', result: 'Parto normal, bezerro macho saudável' },
      { id: 'evt-garoa-ovsynch-1', animalId: garoa.id, sireId: barao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Brahman REY-05', lot: 'Lote Matrizes Outono', reproductiveProtocol: 'Ovsynch', eventDate: daysAgo(28), pregnancyDiagnosis: 'pending', notes: 'Aguardando diagnóstico — 30 dias ideais para confirmar' },
      { id: 'evt-arrepiada-iatf-1', animalId: arrepiada.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-102', lot: 'Lote Vacas Solteiras', reproductiveProtocol: 'IATF', eventDate: daysAgo(120), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(90) },
      { id: 'evt-estrela-iatf-1', animalId: estrela.id, sireId: barao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Brahman REY-05', lot: 'Lote Novilhas 2024', reproductiveProtocol: 'IATF com eCG', eventDate: daysAgo(55), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(25), notes: 'Falha de concepção — pós-parto muito curto no momento da IATF' },
    ],
  });

  // OVINOS
  await prisma.reproductiveEvent.createMany({
    skipDuplicates: true,
    data: [
      { id: 'evt-branca-iatf-1', animalId: branca.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Dorper DR-22', lot: 'Lote Ovelhas Ciclo 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(400), pregnancyDiagnosis: 'positive', result: 'Prenha — parto gemelar', confirmationDate: daysAgo(370) },
      { id: 'evt-branca-parto-1', animalId: branca.id, eventType: 'birth', eventDate: daysAgo(280), pregnancyDiagnosis: 'positive', result: 'Parto gemelar — 2 cordeiros saudáveis' },
      { id: 'evt-branca-iatf-2', animalId: branca.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Dorper DR-22', lot: 'Lote Ovelhas Ciclo 2', reproductiveProtocol: 'IATF', eventDate: daysAgo(200), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(170) },
      { id: 'evt-branca-parto-2', animalId: branca.id, eventType: 'birth', eventDate: daysAgo(95), pregnancyDiagnosis: 'positive', result: 'Parto normal, cordeira fêmea' },
      { id: 'evt-serena-ovsynch-1', animalId: serena.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Morada Nova MN-03', lot: 'Lote Ovelhas Ciclo 2', reproductiveProtocol: 'Ovsynch', eventDate: daysAgo(20), pregnancyDiagnosis: 'pending', notes: 'ECC 2/5 — risco elevado. Monitorar peso pós-inseminação.' },
      { id: 'evt-antonia-iatf-1', animalId: antonia.id, sireId: farao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Ile de France IF-15', lot: 'Lote Ovelhas Ciclo 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(200), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(170), notes: 'Aborto detectado por ultrassom 30 dias pós-inseminação' },
    ],
  });

  // CAPRINOS
  await prisma.reproductiveEvent.createMany({
    skipDuplicates: true,
    data: [
      { id: 'evt-nuvem-iatf-1', animalId: nuvem.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer KN-01', lot: 'Lote Caprinos Ciclo 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(430), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(400) },
      { id: 'evt-nuvem-parto-1', animalId: nuvem.id, eventType: 'birth', eventDate: daysAgo(280), pregnancyDiagnosis: 'positive', result: 'Parto normal — cabrito macho 3,8 kg' },
      { id: 'evt-nuvem-iatf-2', animalId: nuvem.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer KN-02', lot: 'Lote Caprinos Ciclo 2', reproductiveProtocol: 'IATF', eventDate: daysAgo(200), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(170) },
      { id: 'evt-nuvem-parto-2', animalId: nuvem.id, eventType: 'birth', eventDate: daysAgo(80), pregnancyDiagnosis: 'positive', result: 'Parto normal — 2 cabritas fêmeas' },
      { id: 'evt-flor-iatf-1', animalId: flor.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Anglonubiana AG-05', lot: 'Lote Caprinos Ciclo 1', reproductiveProtocol: 'IATF com eCG', eventDate: daysAgo(140), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(110), notes: 'Reabsorção embrionária precoce detectada' },
      { id: 'evt-flor-resync-1', animalId: flor.id, sireId: zeusBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer ZB-01', lot: 'Lote Caprinos Ciclo 2', reproductiveProtocol: 'Ressincronização', eventDate: daysAgo(25), pregnancyDiagnosis: 'pending', notes: 'Segunda tentativa — reprodutor alternado para minimizar homozigose' },
    ],
  });

  // ─── PREDIÇÕES PRÉ-SALVAS (para exibir durante a demo sem esperar IA) ─────────

  // CENÁRIO 1 — Mimosa: análise Expert (mostrar profundidade do relatório)
  await prisma.prediction.create({
    data: {
      id: 'pred-mimosa-expert',
      animalId: mimosa.id, sireId: bumba.id,
      analysisType: 'pregnancy',
      pregnancyProbability: 84, fertilityScore: 87,
      riskLevel: 'low', geneticCompatibility: 92,
      positiveFactors: [
        'Peso de 461 kg — acima do limiar Nelore (380 kg)',
        'ECC 4/5 — reserva energética robusta para implantação embrionária',
        '3 prenhezes anteriores sem abortos — fertilidade comprovada',
        '270 dias pós-parto — involução uterina completa (mínimo 60 dias)',
        'Reprodutor Bumbá: score 88, taxa real 79% (19/24 inseminações)',
      ],
      alerts: [
        'Estação seca — risco nutricional por escassez de forragem nativa',
        'Temperatura 26°C — abaixo do limiar de estresse térmico (32°C)',
      ],
      recommendations: [
        'Manter suplementação mineral (zinco, selênio) durante a estação seca',
        'Confirmar diagnóstico por ultrassom entre 28-35 dias pós-IATF',
        'Monitorar ECC semanalmente durante o protocolo',
        'Verificar qualidade do sêmen do lote antes da inseminação',
        'Oferecer sombreamento nas horas de maior calor para preservar a qualidade oocitária',
      ],
      aiInsight:
        'Mimosa apresenta o perfil mais sólido do lote bovino para IATF neste ciclo. ' +
        'O ECC 4/5, associado ao peso de 461 kg (21% acima do limiar Nelore), indica balanço energético positivo — ' +
        'condição que favorece o pico de LH e a resposta ovariana ao protocolo. ' +
        'O histórico de 3 partos sem abortos confirma integridade do trato reprodutivo. ' +
        'O reprodutor Bumbá (0005) reforça a probabilidade: taxa real de 79% em 24 inseminações com a mesma raça. ' +
        'O único ponto de atenção é a estação seca: a redução de forragem no semiárido pode comprometer ' +
        'o balanço energético nas semanas seguintes à inseminação — suplementação proteico-energética é determinante neste período.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'expert' as any, inputTokens: 340, outputTokens: 510,
      createdAt: daysAgo(3),
    },
  });

  // CENÁRIO 2 — Estrela: análise Standard (risco moderado — para comparação)
  await prisma.prediction.create({
    data: {
      id: 'pred-estrela-standard',
      animalId: estrela.id, sireId: trovao.id,
      analysisType: 'pregnancy',
      pregnancyProbability: 55, fertilityScore: 42,
      riskLevel: 'moderate', geneticCompatibility: 78,
      positiveFactors: [
        'Peso de 388 kg — adequado para Girolando',
        'ECC 3/5 — condição corporal aceitável',
        'Reprodutor Trovão: score 82 (taxa 75% em 12 inseminações)',
      ],
      alerts: [
        'Pós-parto de apenas 40 dias — involução uterina possivelmente incompleta (ideal ≥ 60 dias)',
        'Histórico de 1 aborto — investigar causa (brucelose, BVD)',
        'Estação seca — risco nutricional adicional',
      ],
      recommendations: [
        'Aguardar pelo menos 20 dias adicionais para completar involução uterina',
        'Solicitar exame sorológico antes de novo protocolo (brucelose, IBR)',
        'Manter suplementação proteico-energética para melhorar ECC',
      ],
      aiInsight:
        'Estrela tem perfil de risco moderado neste ciclo. O pós-parto de 40 dias é o fator mais limitante: ' +
        'em Girolando, a involução uterina completa leva em média 45-60 dias, e inseminar antes desse prazo ' +
        'reduz a taxa de concepção em até 30%. O aborto anterior requer investigação antes de novo protocolo. ' +
        'Recomendo postergar 20 dias e realizar exame ginecológico para confirmar a integridade uterina.',
      protocol: 'IATF com eCG', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 338, outputTokens: 310,
      createdAt: daysAgo(2),
    },
  });

  // CENÁRIO 3 — Branca (ovino): análise Standard
  await prisma.prediction.create({
    data: {
      id: 'pred-branca-standard',
      animalId: branca.id, sireId: carneiro42.id,
      analysisType: 'pregnancy',
      pregnancyProbability: 79, fertilityScore: 76,
      riskLevel: 'low', geneticCompatibility: 88,
      positiveFactors: [
        'Peso de 52 kg — acima do limiar Santa Inês (45 kg)',
        'ECC 4/5 — excelente condição corporal',
        '2 prenhezes anteriores incluindo parto gemelar',
        'Pós-parto de 95 dias — involução completa confirmada',
        'Reprodutor Carneiro 42: score 85, taxa real 83% (15/18)',
      ],
      alerts: [
        'Estação seca — Santa Inês é rústica, mas suplementação mineral recomendada',
      ],
      recommendations: [
        'Manter suplementação mineral (fósforo e cobre) durante a seca',
        'Confirmar diagnóstico por ultrassom 25-30 dias pós-IATF',
      ],
      aiInsight:
        'Branca é a melhor candidata ovina do lote. Santa Inês com histórico gemelar (0031 — parto gemelar no 1º ciclo) ' +
        'e ECC 4/5 aos 52 kg indica excelente condição reprodutiva. O Carneiro 42 (0007) reforça: ' +
        '83% de taxa real em 18 inseminações. A raça Santa Inês tem fotoperíodo pouco sensível, ' +
        'o que minimiza o impacto da estação seca na expressão do cio.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 335, outputTokens: 295,
      createdAt: daysAgo(5),
    },
  });

  // CENÁRIO 3b — Serena (ovino): alto risco — para contraste
  await prisma.prediction.create({
    data: {
      id: 'pred-serena-standard',
      animalId: serena.id, sireId: carneiro42.id,
      analysisType: 'pregnancy',
      pregnancyProbability: 44, fertilityScore: 22,
      riskLevel: 'high', geneticCompatibility: 88,
      positiveFactors: [
        'Reprodutor Carneiro 42: score 85',
        'Protocolo Ovsynch — sincronização eficiente',
      ],
      alerts: [
        'Peso 37 kg — 18% abaixo do mínimo Morada Nova (45 kg)',
        'ECC 2/5 — balanço energético negativo suprime eixo reprodutivo',
        'Pós-parto de 35 dias — involução uterina incompleta (ideal ≥ 45 dias)',
        '1 aborto anterior — risco de recorrência',
        'Estação seca — exacerba déficit nutricional',
      ],
      recommendations: [
        'Postergar inseminação no mínimo 15 dias para completar involução',
        'Suplementação energética intensiva: 200g/dia de milho + 50g de ureia protegida',
        'Avaliar causa do aborto anterior antes de novo protocolo',
        'Meta de peso: 42 kg antes da IATF',
      ],
      aiInsight:
        'Serena apresenta três fatores críticos simultâneos: peso 18% abaixo do mínimo, ECC 2/5 e pós-parto de apenas 35 dias. ' +
        'Em Morada Nova, o eixo hipotálamo-hipófise-gonadal é suprimido quando o ECC cai abaixo de 2,5 — ' +
        'o que reduz a secreção de GnRH e compromete a ovulação mesmo com protocolo hormonal. ' +
        'A inseminação neste momento tem baixa eficiência. Recomendo fortemente postergar.',
      protocol: 'Ovsynch', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 336, outputTokens: 318,
      createdAt: daysAgo(2),
    },
  });

  // CENÁRIO 4 — Nuvem (caprino): análise Standard
  await prisma.prediction.create({
    data: {
      id: 'pred-nuvem-standard',
      animalId: nuvem.id, sireId: kingBoer.id,
      analysisType: 'pregnancy',
      pregnancyProbability: 77, fertilityScore: 74,
      riskLevel: 'low', geneticCompatibility: 90,
      positiveFactors: [
        'Peso de 40 kg — adequado para Boer (mínimo 35 kg)',
        'ECC 4/5 — excelente condição corporal',
        '2 partos anteriores sem abortos — fertilidade comprovada',
        'Pós-parto de 80 dias — involução uterina completa',
        'Reprodutor King Boer: score 86, taxa real 80% (16/20)',
      ],
      alerts: [
        'Estação seca — caprinos Boer respondem bem com suplementação',
        'Temperatura 26°C — sem risco de estresse térmico',
      ],
      recommendations: [
        'Suplementar com volumoso de qualidade na pré-inseminação',
        'Confirmar diagnóstico 25 dias pós-IATF por ultrassom',
        'Verificar mineralização do lote (fósforo e vitamina E)',
      ],
      aiInsight:
        'Nuvem tem o perfil mais consistente das caprinas deste ciclo. A raça Boer apresenta alta ' +
        'prolificidade no semiárido, e com 80 dias de pós-parto e ECC 4/5, ' +
        'todas as condições hormonais estão favoráveis para a IATF. ' +
        'O King Boer (0008) tem 80% de taxa real em 20 inseminações — compatibilidade muito boa.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 333, outputTokens: 286,
      createdAt: daysAgo(4),
    },
  });

  // CENÁRIO 4b — Rosa (caprino): alto risco
  await prisma.prediction.create({
    data: {
      id: 'pred-rosa-standard',
      animalId: rosa.id, sireId: kingBoer.id,
      analysisType: 'pregnancy',
      pregnancyProbability: 38, fertilityScore: 10,
      riskLevel: 'high', geneticCompatibility: 90,
      positiveFactors: [
        'Reprodutor King Boer: score 86',
      ],
      alerts: [
        'Peso 28 kg — 20% abaixo do mínimo Canindé (35 kg)',
        'ECC 2/5 — comprometimento severo do balanço energético',
        'Histórico de doença reprodutiva confirmada',
        '1 aborto anterior — risco de recorrência',
        'Estação seca — déficit nutricional agravado',
      ],
      recommendations: [
        'NÃO inseminar neste ciclo — condição corporal incompatível com gestação',
        'Avaliação ginecológica completa obrigatória',
        'Tratamento da condição reprodutiva antes de qualquer protocolo',
        'Meta mínima: ECC 3/5 e peso 36 kg antes da próxima tentativa',
        'Isolamento preventivo do lote para evitar transmissão de agentes infecciosos',
      ],
      aiInsight:
        'Rosa apresenta o quadro mais crítico do lote caprino. O histórico de doença reprodutiva, ' +
        'ECC 2/5 e peso 20% abaixo do mínimo indicam que o organismo não suporta uma gestação neste momento. ' +
        'Em Canindé, raça nativa do semiárido com menor conformação corporal, ' +
        'o mínimo de 35 kg é necessário para manter a gestação sem perdas. ' +
        'Inseminar neste estado aumenta o risco de aborto e agrava o quadro de saúde. ' +
        'Recomendo tratamento veterinário completo antes de qualquer protocolo reprodutivo.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 337, outputTokens: 322,
      createdAt: daysAgo(1),
    },
  });

  // CENÁRIO EXTRA — Melhor Reprodutor para Estrela (best_breeder pré-salvo)
  await prisma.prediction.create({
    data: {
      id: 'pred-estrela-breeder',
      animalId: estrela.id, sireId: trovao.id,
      analysisType: 'best_breeder',
      pregnancyProbability: 82, fertilityScore: 82,
      riskLevel: 'low', geneticCompatibility: 82,
      positiveFactors: [
        'Trovão (0009): score 82, raça Nelore — complementaridade com Girolando',
        'Bumbá (0005): melhor taxa real do lote (79% em 24 inseminações)',
        'Evitar consanguinidade — Trovão sem parentesco com Estrela',
      ],
      alerts: [
        'Barão (0006): taxa real mais baixa (67%) — menos indicado neste cruzamento',
      ],
      recommendations: [
        '1º Trovão (0009) — Nelore, score 82, complementa bem com Girolando',
        '2º Bumbá (0005) — Nelore, score 88, melhor fertilidade do lote',
        '3º Barão (0006) — Brahman, score 73, menor compatibilidade racial',
      ],
      aiInsight:
        'Para Estrela (Girolando, ECC 3), o Trovão (0009 — Nelore, score 82) é a melhor escolha neste ciclo: ' +
        'a complementaridade racial Nelore × Girolando maximiza o vigor híbrido, ' +
        'e os 9 prenhezes confirmados em 12 inseminações mostram consistência. ' +
        'O Bumbá (0005) tem fertilidade superior (score 88), mas já foi o reprodutor da inseminação anterior — ' +
        'rotação genética é recomendada para manter diversidade.',
      aiProfile: 'standard' as any, inputTokens: 338, outputTokens: 298,
      createdAt: daysAgo(1),
    },
  });

  // ─── RESUMO ───────────────────────────────────────────────────────────────────
  const [totalAnimals, totalEvents, totalPredictions] = await Promise.all([
    prisma.animal.count({ where: { farmId } }),
    prisma.reproductiveEvent.count({ where: { animal: { farmId } } }),
    prisma.prediction.count({ where: { animal: { farmId } } }),
  ]);

  console.log('✅ Seed concluído!\n');
  console.log('🔑 Credenciais demo:');
  console.log('   Email : demo@insemiai.com.br');
  console.log('   Senha : Demo@2026\n');
  console.log('🏡 Fazenda     : Fazenda Uruguai — Crateús/CE');
  console.log(`🐄 Animais     : ${totalAnimals}`);
  console.log(`📋 Eventos     : ${totalEvents}`);
  console.log(`🤖 Predições   : ${totalPredictions}\n`);
  console.log('─────────────────────────────────────────');
  console.log('🎯 CENÁRIOS DA DEMO');
  console.log('─────────────────────────────────────────');
  console.log('BOVINOS');
  console.log('  0020 Mimosa    → 84% baixo risco  [Expert, pré-salvo + demo ao vivo]');
  console.log('  0023 Estrela   → 55% risco moderado  [Standard, pré-salvo]');
  console.log('  0021 Garoa     → inseminação pendente 28 dias  [demo ciclo completo]');
  console.log('  0022 Arrepiada → Prenhe  [status variado]');
  console.log('OVINOS');
  console.log('  0030 Branca    → 79% baixo risco  [Standard, pré-salvo + demo ao vivo]');
  console.log('  0031 Serena    → 44% alto risco  [Standard, pré-salvo]');
  console.log('  0032 Luna      → nulípara — moderada  [demo ao vivo]');
  console.log('CAPRINOS');
  console.log('  0040 Nuvem     → 77% baixo risco  [Standard, pré-salvo + demo ao vivo]');
  console.log('  0041 Flor      → diagnóstico pendente  [variedade]');
  console.log('  0042 Rosa      → 38% alto risco  [Standard, pré-salvo]');
  console.log('─────────────────────────────────────────');
  console.log('🧬 REPRODUTORES');
  console.log('  BOVINOS : 0005 Bumbá (88) | 0009 Trovão (82) | 0006 Barão (73)');
  console.log('  OVINOS  : 0007 Carneiro 42 (85) | 0013 Faraó (78)');
  console.log('  CAPRINOS: 0008 King Boer (86) | 0014 Zeus (79)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
