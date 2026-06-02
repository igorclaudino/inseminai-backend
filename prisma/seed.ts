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
        create: [{ weightKg: 52, weighingDate: daysAgo(8) }],
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

  // Branca (ovino): positiva
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
  console.log('   0020 Mimosa    → análise IA (alta probabilidade esperada)');
  console.log('   0021 Garoa     → inseminação pendente de diagnóstico');
  console.log('   0022 Arrepiada → Prenhe (mostra variedade de status)');
  console.log('   0023 Estrela   → Falha na concepção (mostra variedade)');
  console.log('   0030 Branca    → Ovino com histórico positivo');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
