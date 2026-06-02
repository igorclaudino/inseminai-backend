import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Iniciando seed de dados para demo...\n');

  // ─── Usuário ─────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('Demo@2026', 10);
  const user = await prisma.user.upsert({
    where: { email: 'luiza@fazendauruguai.com.br' },
    update: {},
    create: {
      name: 'Luiza Macedo',
      email: 'luiza@fazendauruguai.com.br',
      password,
    },
  });

  // ─── Fazenda ─────────────────────────────────────────────────────────────────
  const existingMembership = await prisma.farmMember.findFirst({ where: { userId: user.id } });
  let farmId = existingMembership?.farmId;

  if (!farmId) {
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
    farmId = farm.id;
  }

  // ─── Reprodutores ─────────────────────────────────────────────────────────────
  const imperadorId = 'breeder-imperador-001';
  const bandoleiroId = 'breeder-bandoleiro-001';
  const nordestinoBrId = 'breeder-nordestino-001';

  await Promise.all([
    prisma.breeder.upsert({
      where: { id: imperadorId },
      update: {},
      create: {
        id: imperadorId,
        name: 'Imperador do Sertão',
        species: 'cattle',
        breed: 'Nelore',
        fertilityScore: 88,
        estimatedScore: 88,
        totalInseminations: 24,
        pregnancies: 19,
        farmId,
      },
    }),
    prisma.breeder.upsert({
      where: { id: bandoleiroId },
      update: {},
      create: {
        id: bandoleiroId,
        name: 'Bandoleiro da FTI',
        species: 'cattle',
        breed: 'Brahman',
        fertilityScore: 73,
        estimatedScore: 73,
        totalInseminations: 15,
        pregnancies: 10,
        farmId,
      },
    }),
    prisma.breeder.upsert({
      where: { id: nordestinoBrId },
      update: {},
      create: {
        id: nordestinoBrId,
        name: 'Nordestino Prime',
        species: 'sheep',
        breed: 'Santa Inês',
        fertilityScore: 85,
        estimatedScore: 85,
        totalInseminations: 18,
        pregnancies: 15,
        farmId,
      },
    }),
  ]);

  // ─── Animais de genealogia ─────────────────────────────────────────────────────
  const bumba = await prisma.animal.upsert({
    where: { id: 'sire-bumba-0005' },
    update: {},
    create: {
      id: 'sire-bumba-0005',
      identifier: '0005', name: 'Bumbá', species: 'cattle', sex: 'male',
      breed: 'Nelore', birthDate: new Date('2017-03-10'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });
  const barao = await prisma.animal.upsert({
    where: { id: 'sire-barao-0006' },
    update: {},
    create: {
      id: 'sire-barao-0006',
      identifier: '0006', name: 'Barão', species: 'cattle', sex: 'male',
      breed: 'Brahman', birthDate: new Date('2016-07-22'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });
  const carneiro42 = await prisma.animal.upsert({
    where: { id: 'sire-carneiro-0007' },
    update: {},
    create: {
      id: 'sire-carneiro-0007',
      identifier: '0007', name: 'Carneiro 42', species: 'sheep', sex: 'male',
      breed: 'Dorper', birthDate: new Date('2019-01-15'),
      bodyConditionScore: 4, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });
  const moeda = await prisma.animal.upsert({
    where: { id: 'dam-moeda-0010' },
    update: {},
    create: {
      id: 'dam-moeda-0010',
      identifier: '0010', name: 'Moeda', species: 'cattle', sex: 'female',
      breed: 'Nelore', birthDate: new Date('2018-05-15'),
      bodyConditionScore: 3, pregnancyHistory: 4, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });
  const florita = await prisma.animal.upsert({
    where: { id: 'dam-florita-0011' },
    update: {},
    create: {
      id: 'dam-florita-0011',
      identifier: '0011', name: 'Florita', species: 'cattle', sex: 'female',
      breed: 'Nelore', birthDate: new Date('2019-11-20'),
      bodyConditionScore: 3, pregnancyHistory: 2, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });
  const canela = await prisma.animal.upsert({
    where: { id: 'dam-canela-0012' },
    update: {},
    create: {
      id: 'dam-canela-0012',
      identifier: '0012', name: 'Canela', species: 'sheep', sex: 'female',
      breed: 'Santa Inês', birthDate: new Date('2019-04-10'),
      bodyConditionScore: 3, pregnancyHistory: 3, reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
    },
  });

  // ─── Animais principais ────────────────────────────────────────────────────────

  const mimosa = await prisma.animal.upsert({
    where: { id: 'animal-mimosa-0020' },
    update: {},
    create: {
      id: 'animal-mimosa-0020',
      identifier: '0020', rfid: '12756', name: 'Mimosa',
      species: 'cattle', sex: 'female', breed: 'Nelore', lineage: 'Lemgruber',
      birthDate: new Date('2008-09-12'),
      sireId: bumba.id, damId: moeda.id,
      bodyConditionScore: 4, reproductiveDiseaseHistory: false,
      pregnancyHistory: 3, birthCount: 3, abortionCount: 0,
      lastBirthDate: daysAgo(270), reproductiveStatus: 'Ready',
      producer: 'Fazenda Uruguai',
      birthWeight: 34.5, weaningWeight: 190.0, preWeaningWeightGain: 0.95,
      farmId, updatedAt: new Date(),
      weighings: {
        create: [
          { weightKg: 390, weighingDate: daysAgo(365) },
          { weightKg: 420, weighingDate: daysAgo(180) },
          { weightKg: 450, weighingDate: daysAgo(90) },
          { weightKg: 461, weighingDate: new Date('2026-05-22'), notes: 'Pesagem pré-protocolo IATF' },
        ],
      },
    },
  });

  const garoa = await prisma.animal.upsert({
    where: { id: 'animal-garoa-0021' },
    update: {},
    create: {
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
      weighings: {
        create: [
          { weightKg: 355, weighingDate: daysAgo(180) },
          { weightKg: 378, weighingDate: daysAgo(60) },
          { weightKg: 398, weighingDate: daysAgo(5) },
        ],
      },
    },
  });

  const arrepiada = await prisma.animal.upsert({
    where: { id: 'animal-arrepiada-0022' },
    update: {},
    create: {
      id: 'animal-arrepiada-0022',
      identifier: '0022', name: 'Arrepiada',
      species: 'cattle', sex: 'female', breed: 'Nelore',
      birthDate: new Date('2019-06-18'),
      bodyConditionScore: 4, reproductiveDiseaseHistory: false,
      pregnancyHistory: 3, birthCount: 3, abortionCount: 0,
      lastBirthDate: daysAgo(300), reproductiveStatus: 'Pregnant',
      producer: 'Fazenda Uruguai',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [
          { weightKg: 430, weighingDate: daysAgo(120) },
          { weightKg: 452, weighingDate: daysAgo(30), notes: 'Prenha — controle de peso' },
        ],
      },
    },
  });

  const estrela = await prisma.animal.upsert({
    where: { id: 'animal-estrela-0023' },
    update: {},
    create: {
      id: 'animal-estrela-0023',
      identifier: '0023', name: 'Estrela',
      species: 'cattle', sex: 'female', breed: 'Girolando',
      birthDate: new Date('2022-07-20'),
      bodyConditionScore: 3, pregnancyHistory: 1, birthCount: 1,
      abortionCount: 1, lastBirthDate: daysAgo(40),
      reproductiveStatus: 'Ready',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [{ weightKg: 388, weighingDate: daysAgo(10) }],
      },
    },
  });

  // ── OVINOS ────────────────────────────────────────────────────────────────────
  // Branca: Santa Inês, 2 prenhezes, boa condição → alta probabilidade
  const branca = await prisma.animal.upsert({
    where: { id: 'animal-branca-0030' },
    update: {},
    create: {
      id: 'animal-branca-0030',
      identifier: '0030', name: 'Branca',
      species: 'sheep', sex: 'female', breed: 'Santa Inês',
      birthDate: new Date('2022-01-10'),
      sireId: carneiro42.id, damId: canela.id,
      bodyConditionScore: 4, pregnancyHistory: 2, birthCount: 2,
      abortionCount: 0, lastBirthDate: daysAgo(95),
      reproductiveStatus: 'Ready',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [
          { weightKg: 48, weighingDate: daysAgo(120) },
          { weightKg: 52, weighingDate: daysAgo(8) },
        ],
      },
    },
  });

  // Serena: pós-parto curto (35 dias) + ECC baixo → risco alto
  const serena = await prisma.animal.upsert({
    where: { id: 'animal-serena-0031' },
    update: {},
    create: {
      id: 'animal-serena-0031',
      identifier: '0031', name: 'Serena',
      species: 'sheep', sex: 'female', breed: 'Morada Nova',
      birthDate: new Date('2021-08-20'),
      bodyConditionScore: 2, pregnancyHistory: 2, birthCount: 2,
      abortionCount: 1, lastBirthDate: daysAgo(35),
      reproductiveStatus: 'Ready',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [{ weightKg: 37, weighingDate: daysAgo(6), notes: 'Baixo peso — requer suplementação' }],
      },
    },
  });

  // Luna: nulípara jovem, boa condição corporal → probabilidade moderada
  const luna = await prisma.animal.upsert({
    where: { id: 'animal-luna-0032' },
    update: {},
    create: {
      id: 'animal-luna-0032',
      identifier: '0032', name: 'Luna',
      species: 'sheep', sex: 'female', breed: 'Dorper',
      birthDate: new Date('2024-03-15'),
      bodyConditionScore: 4, pregnancyHistory: 0, birthCount: 0,
      abortionCount: 0, reproductiveStatus: 'Ready',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [{ weightKg: 48, weighingDate: daysAgo(4) }],
      },
    },
  });

  // ── CAPRINOS ─────────────────────────────────────────────────────────────────
  // Reprodutor caprino
  const kingBoerId = 'breeder-king-boer-001';
  await prisma.breeder.upsert({
    where: { id: kingBoerId },
    update: {},
    create: {
      id: kingBoerId,
      name: 'King Boer',
      species: 'goat', breed: 'Boer',
      fertilityScore: 86, estimatedScore: 86,
      totalInseminations: 20, pregnancies: 16,
      farmId,
    },
  });

  // Nuvem: Boer, 2 prenhezes, boa condição → alta probabilidade
  const nuvem = await prisma.animal.upsert({
    where: { id: 'animal-nuvem-0040' },
    update: {},
    create: {
      id: 'animal-nuvem-0040',
      identifier: '0040', name: 'Nuvem',
      species: 'goat', sex: 'female', breed: 'Boer',
      birthDate: new Date('2022-04-05'),
      bodyConditionScore: 4, pregnancyHistory: 2, birthCount: 2,
      abortionCount: 0, lastBirthDate: daysAgo(80),
      reproductiveStatus: 'Ready',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [
          { weightKg: 36, weighingDate: daysAgo(90) },
          { weightKg: 40, weighingDate: daysAgo(5) },
        ],
      },
    },
  });

  // Flor: Anglonubiana, 1 aborto, ECC médio → probabilidade moderada
  const flor = await prisma.animal.upsert({
    where: { id: 'animal-flor-0041' },
    update: {},
    create: {
      id: 'animal-flor-0041',
      identifier: '0041', name: 'Flor',
      species: 'goat', sex: 'female', breed: 'Anglonubiana',
      birthDate: new Date('2022-08-12'),
      bodyConditionScore: 3, pregnancyHistory: 1, birthCount: 1,
      abortionCount: 1, lastBirthDate: daysAgo(70),
      reproductiveStatus: 'Ready',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [{ weightKg: 37, weighingDate: daysAgo(7) }],
      },
    },
  });

  // Rosa: ECC baixo + histórico de doença reprodutiva → alto risco
  const rosa = await prisma.animal.upsert({
    where: { id: 'animal-rosa-0042' },
    update: {},
    create: {
      id: 'animal-rosa-0042',
      identifier: '0042', name: 'Rosa',
      species: 'goat', sex: 'female', breed: 'Canindé',
      birthDate: new Date('2021-12-20'),
      bodyConditionScore: 2, pregnancyHistory: 0, birthCount: 0,
      abortionCount: 1, reproductiveDiseaseHistory: true,
      reproductiveStatus: 'Ready',
      farmId, updatedAt: new Date(),
      weighings: {
        create: [{ weightKg: 28, weighingDate: daysAgo(4), notes: 'Peso abaixo do mínimo — intervenção necessária' }],
      },
    },
  });

  // ─── Eventos reprodutivos ─────────────────────────────────────────────────────

  // Mimosa: inseminação positiva + parto (histórico)
  await prisma.reproductiveEvent.createMany({
    skipDuplicates: true,
    data: [
      {
        animalId: mimosa.id, breederId: imperadorId,
        eventType: 'artificial_insemination',
        inseminator: 'Dr. Fernando Lima',
        semenUsed: 'Nelore MAX-102', lot: 'Lote 05 - Primíparas',
        reproductiveProtocol: 'IATF',
        eventDate: daysAgo(450), pregnancyDiagnosis: 'positive',
        result: 'Prenhez confirmada por ultrassom',
        confirmationDate: daysAgo(420),
        notes: 'Animal em excelente condição corporal',
      },
      {
        animalId: mimosa.id,
        eventType: 'birth', eventDate: daysAgo(270),
        pregnancyDiagnosis: 'positive',
        result: 'Parto normal, bezerro macho saudável',
      },
    ],
  });

  // Garoa: inseminação pendente de diagnóstico (30 dias atrás — momento ideal para diagnóstico na demo)
  await prisma.reproductiveEvent.create({
    data: {
      animalId: garoa.id, breederId: bandoleiroId,
      eventType: 'artificial_insemination',
      inseminator: 'Dr. Fernando Lima',
      semenUsed: 'Brahman REY-05', lot: 'Lote Matrizes Outono',
      reproductiveProtocol: 'Ovsynch',
      eventDate: daysAgo(28), pregnancyDiagnosis: 'pending',
      notes: 'Aguardando diagnóstico de prenhez (30 dias)',
    },
  });

  // Arrepiada: inseminação positiva (está prenhe)
  await prisma.reproductiveEvent.create({
    data: {
      animalId: arrepiada.id, breederId: imperadorId,
      eventType: 'artificial_insemination',
      inseminator: 'Dr. Fernando Lima',
      semenUsed: 'Nelore MAX-102', lot: 'Lote Vacas Solteiras',
      reproductiveProtocol: 'IATF',
      eventDate: daysAgo(120), pregnancyDiagnosis: 'positive',
      result: 'Prenha', confirmationDate: daysAgo(90),
    },
  });

  // Estrela: falha na concepção
  await prisma.reproductiveEvent.create({
    data: {
      animalId: estrela.id, breederId: bandoleiroId,
      eventType: 'artificial_insemination',
      inseminator: 'Dr. Fernando Lima',
      semenUsed: 'Brahman REY-05', lot: 'Lote Novilhas 2024',
      reproductiveProtocol: 'IATF com eCG',
      eventDate: daysAgo(55), pregnancyDiagnosis: 'conception_failure',
      result: 'Vazia', confirmationDate: daysAgo(25),
      notes: 'Nova tentativa programada para o próximo protocolo',
    },
  });

  // Branca (ovino): histórico positivo
  await prisma.reproductiveEvent.create({
    data: {
      animalId: branca.id, breederId: nordestinoBrId,
      eventType: 'artificial_insemination',
      inseminator: 'Dr. Fernando Lima',
      semenUsed: 'Santa Inês NR-08', lot: 'Lote Ovelhas Selecionadas',
      reproductiveProtocol: 'IATF',
      eventDate: daysAgo(230), pregnancyDiagnosis: 'positive',
      result: 'Prenhez gemelar confirmada', confirmationDate: daysAgo(200),
    },
  });

  // Serena (ovino): inseminação recente com diagnóstico pendente
  await prisma.reproductiveEvent.create({
    data: {
      animalId: serena.id, breederId: nordestinoBrId,
      eventType: 'artificial_insemination',
      inseminator: 'Dr. Fernando Lima',
      semenUsed: 'Morada Nova MN-03', lot: 'Lote Ovelhas Ciclo 2',
      reproductiveProtocol: 'Ovsynch',
      eventDate: daysAgo(20), pregnancyDiagnosis: 'pending',
      notes: 'Animal com ECC baixo — monitorar peso',
    },
  });

  // Nuvem (caprino): histórico positivo + inseminação pendente recente
  await prisma.reproductiveEvent.createMany({
    skipDuplicates: true,
    data: [
      {
        animalId: nuvem.id, breederId: kingBoerId,
        eventType: 'artificial_insemination',
        inseminator: 'Dr. Fernando Lima',
        semenUsed: 'Boer KN-01', lot: 'Lote Caprinos Selecionados',
        reproductiveProtocol: 'IATF',
        eventDate: daysAgo(260), pregnancyDiagnosis: 'positive',
        result: 'Prenhez confirmada', confirmationDate: daysAgo(230),
      },
      {
        animalId: nuvem.id, eventType: 'birth',
        eventDate: daysAgo(80), pregnancyDiagnosis: 'positive',
        result: 'Parto normal, cabrito saudável',
      },
    ],
  });

  // Flor (caprino): falha na concepção anterior + nova tentativa pendente
  await prisma.reproductiveEvent.createMany({
    skipDuplicates: true,
    data: [
      {
        animalId: flor.id, breederId: kingBoerId,
        eventType: 'artificial_insemination',
        inseminator: 'Dr. Fernando Lima',
        semenUsed: 'Anglonubiana AG-05', lot: 'Lote Caprinos Ciclo 1',
        reproductiveProtocol: 'IATF com eCG',
        eventDate: daysAgo(140), pregnancyDiagnosis: 'conception_failure',
        result: 'Vazia', confirmationDate: daysAgo(110),
        notes: 'Aborto precoce — histórico de reabsorção',
      },
      {
        animalId: flor.id, breederId: kingBoerId,
        eventType: 'artificial_insemination',
        inseminator: 'Dr. Fernando Lima',
        semenUsed: 'Boer KN-01', lot: 'Lote Caprinos Ciclo 2',
        reproductiveProtocol: 'Ressincronização',
        eventDate: daysAgo(25), pregnancyDiagnosis: 'pending',
        notes: 'Segunda tentativa após falha no ciclo anterior',
      },
    ],
  });

  // ─── Predições de IA ──────────────────────────────────────────────────────────
  await prisma.prediction.create({
    data: {
      animalId: mimosa.id, breederId: imperadorId,
      analysisType: 'pregnancy',
      pregnancyProbability: 81, fertilityScore: 77,
      riskLevel: 'low', geneticCompatibility: 90,
      positiveFactors: [
        'Peso adequado (461 kg)',
        'Pós-parto adequado (270 dias)',
        'Histórico reprodutivo positivo (3 prenhezes anteriores)',
        'Sem histórico de abortos',
        'Boa condição corporal (escore 4/5)',
        'Sem histórico de doenças reprodutivas',
        'Animal com status Apto',
        'Reprodutor com alta fertilidade (score 88)',
        'Protocolo IATF — alta precisão de sincronização',
        'Fazenda com boa taxa histórica (68%)',
      ],
      alerts: ['Estação seca — maior risco nutricional'],
      recommendations: ['Garantir suplementação durante o período seco', 'Monitorar prenhez em 30 dias'],
      aiInsight:
        'Mimosa apresenta excelente perfil reprodutivo para a IATF. Com escore corporal 4/5, ' +
        'histórico limpo de 3 prenhezes e o reprodutor Imperador do Sertão (score 88), ' +
        'a probabilidade de 81% reflete condições muito favoráveis. ' +
        'Atenção à suplementação mineral durante o período seco para manter o desempenho.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 52, outputTokens: 94,
      createdAt: daysAgo(3),
    },
  });

  // Branca (ovino) — alta probabilidade
  await prisma.prediction.create({
    data: {
      animalId: branca.id, breederId: nordestinoBrId,
      analysisType: 'pregnancy',
      pregnancyProbability: 78, fertilityScore: 72,
      riskLevel: 'low', geneticCompatibility: 87,
      positiveFactors: [
        'Peso adequado (52 kg)',
        'Pós-parto adequado (95 dias)',
        'Histórico reprodutivo positivo (2 prenhezes anteriores)',
        'Sem histórico de abortos',
        'Boa condição corporal (escore 4/5)',
        'Sem histórico de doenças reprodutivas',
        'Animal com status Apto',
        'Reprodutor com alta fertilidade (score 85)',
        'Protocolo IATF — alta precisão de sincronização',
        'Fazenda com boa taxa histórica (68%)',
      ],
      alerts: ['Estação seca — maior risco nutricional'],
      recommendations: ['Garantir suplementação durante o período seco', 'Monitorar prenhez em 30 dias'],
      aiInsight:
        'Branca apresenta excelente perfil reprodutivo para IATF em ovinos Santa Inês. ' +
        'Com pós-parto de 95 dias, ECC 4/5 e histórico limpo, as condições são favoráveis. ' +
        'A raça Santa Inês é naturalmente adaptada ao clima do Sertão, o que reduz o impacto da estação seca.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 48, outputTokens: 86,
      createdAt: daysAgo(5),
    },
  });

  // Serena (ovino) — alto risco
  await prisma.prediction.create({
    data: {
      animalId: serena.id, breederId: nordestinoBrId,
      analysisType: 'pregnancy',
      pregnancyProbability: 47, fertilityScore: 20,
      riskLevel: 'high', geneticCompatibility: 87,
      positiveFactors: [
        'Reprodutor com alta fertilidade (score 85)',
        'Fazenda com boa taxa histórica (68%)',
        'Protocolo Ovsynch — sincronização eficiente',
      ],
      alerts: [
        'Peso abaixo do ideal (37 kg — mínimo 45 kg)',
        'Pós-parto curto (35 dias — ideal ≥ 45)',
        'Histórico de 1 aborto(s)',
        'Condição corporal baixa (escore 2/5)',
        'Estação seca — maior risco nutricional',
      ],
      recommendations: [
        'Melhorar suplementação nutricional antes da inseminação',
        'Aguardar período pós-parto mínimo de 45 dias',
        'Melhorar condição corporal antes do protocolo',
        'Garantir suplementação durante o período seco',
        'Monitorar prenhez em 30 dias',
      ],
      aiInsight:
        'Serena apresenta múltiplos fatores de risco que comprometem as chances de prenhez. ' +
        'O pós-parto de apenas 35 dias, aliado ao ECC 2/5 e peso abaixo do mínimo, indicam ' +
        'que o organismo ainda não recuperou as reservas corporais necessárias. ' +
        'Recomenda-se postergar a inseminação por pelo menos 15 dias e intensificar a suplementação proteica.',
      protocol: 'Ovsynch', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 50, outputTokens: 95,
      createdAt: daysAgo(2),
    },
  });

  // Nuvem (caprino) — alta probabilidade
  await prisma.prediction.create({
    data: {
      animalId: nuvem.id, breederId: kingBoerId,
      analysisType: 'pregnancy',
      pregnancyProbability: 76, fertilityScore: 68,
      riskLevel: 'low', geneticCompatibility: 88,
      positiveFactors: [
        'Peso adequado (40 kg)',
        'Pós-parto adequado (80 dias)',
        'Histórico reprodutivo positivo (2 prenhezes anteriores)',
        'Sem histórico de abortos',
        'Boa condição corporal (escore 4/5)',
        'Sem histórico de doenças reprodutivas',
        'Animal com status Apto',
        'Reprodutor com alta fertilidade (score 86)',
        'Protocolo IATF — alta precisão de sincronização',
        'Fazenda com boa taxa histórica (68%)',
      ],
      alerts: ['Estação seca — maior risco nutricional'],
      recommendations: ['Garantir suplementação durante o período seco', 'Monitorar prenhez em 30 dias'],
      aiInsight:
        'Nuvem é uma excelente candidata para IATF caprino. Raça Boer com alta conversão reprodutiva, ' +
        'ECC ideal e histórico positivo de 2 partos. O reprodutor King Boer (score 86) reforça a compatibilidade genética. ' +
        'Atenção à mineralização no período seco, especialmente zinco e selênio.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 46, outputTokens: 88,
      createdAt: daysAgo(4),
    },
  });

  // Flor (caprino) — moderada
  await prisma.prediction.create({
    data: {
      animalId: flor.id, breederId: kingBoerId,
      analysisType: 'pregnancy',
      pregnancyProbability: 59, fertilityScore: 40,
      riskLevel: 'moderate', geneticCompatibility: 88,
      positiveFactors: [
        'Peso adequado (37 kg)',
        'Pós-parto adequado (70 dias)',
        'Histórico reprodutivo positivo (1 prenhez anterior)',
        'Boa condição corporal (escore 3/5)',
        'Sem histórico de doenças reprodutivas',
        'Animal com status Apto',
        'Reprodutor com alta fertilidade (score 86)',
        'Protocolo Ressincronização — sincronização eficiente',
      ],
      alerts: [
        'Histórico de 1 aborto(s)',
        'Estação seca — maior risco nutricional',
      ],
      recommendations: [
        'Garantir suplementação durante o período seco',
        'Monitorar prenhez em 30 dias',
      ],
      aiInsight:
        'Flor tem perfil moderado para Ressincronização. O histórico de falha na concepção no ciclo anterior ' +
        'e o aborto registrado reduzem a probabilidade, mas o ECC 3/5 e o bom pós-parto são fatores positivos. ' +
        'Recomenda-se vitamina E e selênio 30 dias antes do protocolo para melhorar taxa de concepção.',
      protocol: 'Ressincronização', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 49, outputTokens: 90,
      createdAt: daysAgo(1),
    },
  });

  // Rosa (caprino) — alto risco
  await prisma.prediction.create({
    data: {
      animalId: rosa.id, breederId: kingBoerId,
      analysisType: 'pregnancy',
      pregnancyProbability: 42, fertilityScore: 12,
      riskLevel: 'high', geneticCompatibility: 88,
      positiveFactors: [
        'Reprodutor com alta fertilidade (score 86)',
        'Fazenda com boa taxa histórica (68%)',
      ],
      alerts: [
        'Peso abaixo do ideal (28 kg — mínimo 35 kg)',
        'Histórico de 1 aborto(s)',
        'Condição corporal baixa (escore 2/5)',
        'Animal com histórico de doença reprodutiva',
        'Estação seca — maior risco nutricional',
      ],
      recommendations: [
        'Melhorar suplementação nutricional antes da inseminação',
        'Melhorar condição corporal antes do protocolo',
        'Avaliação veterinária prévia recomendada',
        'Garantir suplementação durante o período seco',
        'Monitorar prenhez em 30 dias',
      ],
      aiInsight:
        'Rosa apresenta quadro de alto risco reprodutivo. O histórico de doença reprodutiva, ' +
        'associado ao ECC 2/5 e peso 20% abaixo do mínimo recomendado para caprinos, indica que a inseminação ' +
        'neste momento é de baixa eficiência. Recomenda-se avaliação ginecológica, tratamento de qualquer ' +
        'afecção subjacente e recuperação da condição corporal antes de iniciar o protocolo.',
      protocol: 'IATF', ambientTemperature: 26, season: 'dry',
      aiProfile: 'standard' as any, inputTokens: 47, outputTokens: 98,
      createdAt: daysAgo(0),
    },
  });

  // ─── Resumo ───────────────────────────────────────────────────────────────────
  const [totalAnimals, totalBreeders, totalEvents] = await Promise.all([
    prisma.animal.count({ where: { farmId } }),
    prisma.breeder.count({ where: { farmId } }),
    prisma.reproductiveEvent.count({ where: { animal: { farmId } } }),
  ]);

  console.log('✅ Seed concluído!\n');
  console.log('🔑 Credenciais demo:');
  console.log('   Email : luiza@fazendauruguai.com.br');
  console.log('   Senha : Demo@2026\n');
  console.log('🏡 Fazenda      : Fazenda Uruguai — Crateús/CE');
  console.log(`🐄 Animais      : ${totalAnimals}`);
  console.log(`🧬 Reprodutores : ${totalBreeders}`);
  console.log(`📋 Eventos      : ${totalEvents}\n`);
  console.log('🎯 Animais-chave para a demo:');
  console.log('   BOVINOS');
  console.log('   0020 Mimosa    → alta probabilidade (81%)');
  console.log('   0021 Garoa     → inseminação pendente de diagnóstico');
  console.log('   0022 Arrepiada → prenhe (variedade de status)');
  console.log('   0023 Estrela   → falha na concepção');
  console.log('   OVINOS');
  console.log('   0030 Branca    → alta probabilidade (78%)');
  console.log('   0031 Serena    → alto risco (47%) — pós-parto curto + baixo ECC');
  console.log('   0032 Luna      → nulípara moderada');
  console.log('   CAPRINOS');
  console.log('   0040 Nuvem     → alta probabilidade (76%)');
  console.log('   0041 Flor      → moderada (59%) — histórico de falha');
  console.log('   0042 Rosa      → alto risco (42%) — doença reprodutiva + baixo peso');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
