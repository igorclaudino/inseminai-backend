import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

function animalPhoto(emoji: string, name: string, breed: string, bg = '#1B4332'): string {
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="${bg}"/>
    <text x="200" y="125" font-family="Arial,sans-serif" font-size="80" text-anchor="middle">${emoji}</text>
    <text x="200" y="195" font-family="Arial,sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">${name}</text>
    <text x="200" y="228" font-family="Arial,sans-serif" font-size="16" fill="rgba(255,255,255,0.7)" text-anchor="middle">${breed}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function main() {
  console.log('🌱 Iniciando seed de dados para demo...\n');

  // ─── Limpeza completa da conta demo ──────────────────────────────────────────
  console.log('🧹 Limpando dados anteriores...');
  for (const email of ['demo@insemiai.com.br', 'demo@inseminai.com.br']) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) continue;
    const m = await prisma.farmMember.findFirst({ where: { userId: u.id } });
    if (m) {
      const fId = m.farmId;
      await prisma.prediction.deleteMany({ where: { animal: { farmId: fId } } });
      await prisma.reproductiveEvent.deleteMany({ where: { animal: { farmId: fId } } });
      await prisma.weighing.deleteMany({ where: { animal: { farmId: fId } } });
      await prisma.farmMember.deleteMany({ where: { farmId: fId } });
      await prisma.farmInvitation.deleteMany({ where: { farmId: fId } });
      await prisma.animal.deleteMany({ where: { farmId: fId } });
      await prisma.farm.delete({ where: { id: fId } });
    }
    await prisma.user.delete({ where: { id: u.id } });
  }
  console.log('✅ Limpeza concluída.\n');

  // ─── Usuário e Fazenda ────────────────────────────────────────────────────────
  const password = await bcrypt.hash('Demo@2026', 10);
  const user = await prisma.user.create({
    data: { name: 'Admin Demo', email: 'demo@inseminai.com.br', password },
  });

  const farm = await prisma.farm.create({
    data: {
      name: 'Fazenda Uruguai', city: 'Crateús', state: 'CE',
      averagePregnancyRate: 68, ownerId: user.id, aiProfile: 'standard',
    },
  });
  await prisma.farmMember.create({ data: { farmId: farm.id, userId: user.id, role: 'admin' } });
  const farmId = farm.id;

  // ─── REPRODUTORES ─────────────────────────────────────────────────────────────
  // Contadores definidos para bater EXATAMENTE com os eventos criados abaixo.
  // fertilityScore = round(pregnanciesAsBreeder / totalInseminations * 100)

  // Bumbá: 7 inseminações (Mimosa×2 + Arrepiada×4 + Estrela×1) → 6 positivas = 86%
  const bumba = await prisma.animal.create({ data: {
    identifier: '0005', name: 'Bumbá', species: 'cattle', sex: 'male',
    breed: 'Nelore', lineage: 'Boi do Sertão', birthDate: new Date('2017-03-10'),
    bodyConditionScore: 4, reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    fertilityScore: 86, totalInseminations: 7, pregnanciesAsBreeder: 6,
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 610, weighingDate: daysAgo(180) },
      { weightKg: 628, weighingDate: daysAgo(60) },
      { weightKg: 635, weighingDate: daysAgo(10) },
    ]},
  }});

  // Barão: 4 inseminações (Garoa×2 + Estrela×1 + Princesa×1) → 2 positivas = 50%
  const barao = await prisma.animal.create({ data: {
    identifier: '0006', name: 'Barão', species: 'cattle', sex: 'male',
    breed: 'Brahman', birthDate: new Date('2016-07-22'),
    bodyConditionScore: 4, reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    fertilityScore: 50, totalInseminations: 4, pregnanciesAsBreeder: 2,
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 575, weighingDate: daysAgo(120) },
      { weightKg: 588, weighingDate: daysAgo(15) },
    ]},
  }});

  // Trovão: 4 inseminações (Mimosa×1 + Bela×1 + Princesa×2) → 3 positivas = 75%
  const trovao = await prisma.animal.create({ data: {
    identifier: '0009', name: 'Trovão', species: 'cattle', sex: 'male',
    breed: 'Nelore', lineage: 'Linhagem Lemgruber', birthDate: new Date('2019-05-18'),
    bodyConditionScore: 4, reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    fertilityScore: 75, totalInseminations: 4, pregnanciesAsBreeder: 3,
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 550, weighingDate: daysAgo(90) },
      { weightKg: 568, weighingDate: daysAgo(12) },
    ]},
  }});

  // Carneiro 42: 6 inseminações (Branca×2 + Serena×3 + Antônia×1) → 5 positivas = 83%
  const carneiro42 = await prisma.animal.create({ data: {
    identifier: '0007', name: 'Carneiro 42', species: 'sheep', sex: 'male',
    breed: 'Dorper', birthDate: new Date('2019-01-15'),
    bodyConditionScore: 4, reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    fertilityScore: 83, totalInseminations: 6, pregnanciesAsBreeder: 5,
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 93, weighingDate: daysAgo(60) },
      { weightKg: 97, weighingDate: daysAgo(8) },
    ]},
  }});

  // Faraó: 2 inseminações (Antônia×1 + Luna×1) → 0 positivas = 0%
  const farao = await prisma.animal.create({ data: {
    identifier: '0013', name: 'Faraó', species: 'sheep', sex: 'male',
    breed: 'Ile de France', birthDate: new Date('2020-08-10'),
    bodyConditionScore: 3, reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    fertilityScore: 0, totalInseminations: 2, pregnanciesAsBreeder: 0,
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 86, weighingDate: daysAgo(45) },
      { weightKg: 89, weighingDate: daysAgo(9) },
    ]},
  }});

  // King Boer: 5 inseminações (Nuvem×2 + Flor×2 + Safira×1) → 4 positivas = 80%
  const kingBoer = await prisma.animal.create({ data: {
    identifier: '0008', name: 'King Boer', species: 'goat', sex: 'male',
    breed: 'Boer', birthDate: new Date('2018-06-10'),
    bodyConditionScore: 4, reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    fertilityScore: 80, totalInseminations: 5, pregnanciesAsBreeder: 4,
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 70, weighingDate: daysAgo(90) },
      { weightKg: 74, weighingDate: daysAgo(10) },
    ]},
  }});

  // Zeus: 2 inseminações (Rosa×1 + Flor×1 pendente) → 0 positivas = 0%
  const zeusBoer = await prisma.animal.create({ data: {
    identifier: '0014', name: 'Zeus', species: 'goat', sex: 'male',
    breed: 'Boer', birthDate: new Date('2020-03-22'),
    bodyConditionScore: 3, reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    fertilityScore: 0, totalInseminations: 2, pregnanciesAsBreeder: 0,
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 63, weighingDate: daysAgo(40) },
      { weightKg: 65, weighingDate: daysAgo(7) },
    ]},
  }});

  // ─── GENEALOGIA ───────────────────────────────────────────────────────────────
  const moeda = await prisma.animal.create({ data: {
    identifier: '0010', name: 'Moeda', species: 'cattle', sex: 'female',
    breed: 'Nelore', birthDate: new Date('2018-05-15'),
    bodyConditionScore: 3, pregnancyHistory: 4, birthCount: 4,
    reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
  }});
  const florita = await prisma.animal.create({ data: {
    identifier: '0011', name: 'Florita', species: 'cattle', sex: 'female',
    breed: 'Nelore', birthDate: new Date('2019-11-20'),
    bodyConditionScore: 3, pregnancyHistory: 2, birthCount: 2,
    reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
  }});
  const canela = await prisma.animal.create({ data: {
    identifier: '0012', name: 'Canela', species: 'sheep', sex: 'female',
    breed: 'Santa Inês', birthDate: new Date('2019-04-10'),
    bodyConditionScore: 3, pregnancyHistory: 3, birthCount: 3,
    reproductiveStatus: 'Ready', farmId, updatedAt: new Date(),
  }});

  // ─── FÊMEAS BOVINAS ───────────────────────────────────────────────────────────
  // pregnancyHistory = nº de inseminações positivas criadas abaixo
  // birthCount = nº de eventos birth criados abaixo
  // lastBirthDate = data do último birth event

  // Mimosa: 3 prenhezes (Bumbá×2, Trovão×1) — CENÁRIO PRINCIPAL
  // Parto 3 (último): Trovão daysAgo(550) → nasc daysAgo(270) [550-280=270]
  const mimosa = await prisma.animal.create({ data: {
    identifier: '0020', rfid: '12756', name: 'Mimosa',
    species: 'cattle', sex: 'female', breed: 'Nelore', lineage: 'Lemgruber',
    birthDate: new Date('2018-09-12'), sireId: bumba.id, damId: moeda.id,
    bodyConditionScore: 4, reproductiveDiseaseHistory: false,
    pregnancyHistory: 3, birthCount: 3, abortionCount: 0,
    lastBirthDate: daysAgo(270), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', birthWeight: 34.5, weaningWeight: 190.0, preWeaningWeightGain: 0.95,
    photoUrl: animalPhoto('🐄', 'Mimosa', 'Nelore'),
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 380, weighingDate: daysAgo(540) },
      { weightKg: 415, weighingDate: daysAgo(365) },
      { weightKg: 432, weighingDate: daysAgo(270), notes: 'Pós-parto ciclo 3' },
      { weightKg: 449, weighingDate: daysAgo(90), notes: 'Controle pré-protocolo' },
      { weightKg: 461, weighingDate: daysAgo(15), notes: 'Pesagem pré-IATF' },
    ]},
  }});

  // Garoa: 1 prenhez (Barão) + pendente há 28 dias — CICLO COMPLETO DA DEMO
  // Parto 1: Barão daysAgo(400) → nasc daysAgo(120) [400-280=120]
  const garoa = await prisma.animal.create({ data: {
    identifier: '0021', name: 'Garoa',
    species: 'cattle', sex: 'female', breed: 'Brahman',
    birthDate: new Date('2021-04-05'), sireId: barao.id, damId: florita.id,
    bodyConditionScore: 3, reproductiveDiseaseHistory: false,
    pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
    lastBirthDate: daysAgo(120), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai',
    photoUrl: animalPhoto('🐄', 'Garoa', 'Brahman', '#2D6A4F'),
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 335, weighingDate: daysAgo(360) },
      { weightKg: 358, weighingDate: daysAgo(180) },
      { weightKg: 380, weighingDate: daysAgo(60) },
      { weightKg: 396, weighingDate: daysAgo(5), notes: 'Pré-IATF' },
    ]},
  }});

  // Arrepiada: 4 prenhezes Bumbá — 3 partos + atualmente prenhe
  // Parto 3 (último): Bumbá daysAgo(560) → nasc daysAgo(280) [560-280=280]
  const arrepiada = await prisma.animal.create({ data: {
    identifier: '0022', name: 'Arrepiada',
    species: 'cattle', sex: 'female', breed: 'Nelore',
    birthDate: new Date('2019-06-18'),
    bodyConditionScore: 4, reproductiveDiseaseHistory: false,
    pregnancyHistory: 4, birthCount: 3, abortionCount: 0,
    lastBirthDate: daysAgo(280), reproductiveStatus: 'Pregnant',
    producer: 'Fazenda Uruguai', farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 395, weighingDate: daysAgo(500) },
      { weightKg: 418, weighingDate: daysAgo(280), notes: 'Pós-parto ciclo 3' },
      { weightKg: 435, weighingDate: daysAgo(120), notes: 'Pré-IATF ciclo 4' },
      { weightKg: 448, weighingDate: daysAgo(30), notes: 'Controle gestação' },
    ]},
  }});

  // Estrela: 1 prenhez (Barão) + falha recente (Bumbá, pós-parto apenas 25 dias) — risco moderado
  // Parto: Barão daysAgo(335) → nasc daysAgo(55) [335-280=55]
  const estrela = await prisma.animal.create({ data: {
    identifier: '0023', name: 'Estrela',
    species: 'cattle', sex: 'female', breed: 'Girolando',
    birthDate: new Date('2022-07-20'),
    bodyConditionScore: 3, reproductiveDiseaseHistory: false,
    pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
    lastBirthDate: daysAgo(55), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai',
    photoUrl: animalPhoto('🐄', 'Estrela', 'Girolando', '#40916C'),
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 362, weighingDate: daysAgo(200) },
      { weightKg: 370, weighingDate: daysAgo(55), notes: 'Pós-parto' },
      { weightKg: 385, weighingDate: daysAgo(10) },
    ]},
  }});

  // Princesa: 1 prenhez (Trovão) + 2 falhas — risco alto (ECC 2 + doença reprodutiva)
  // Parto: Trovão daysAgo(380) → nasc daysAgo(100) [380-280=100]
  const princesa = await prisma.animal.create({ data: {
    identifier: '0024', name: 'Princesa',
    species: 'cattle', sex: 'female', breed: 'Angus',
    birthDate: new Date('2021-02-14'),
    bodyConditionScore: 2, reproductiveDiseaseHistory: true,
    pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
    lastBirthDate: daysAgo(100), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 345, weighingDate: daysAgo(180) },
      { weightKg: 330, weighingDate: daysAgo(60) },
      { weightKg: 334, weighingDate: daysAgo(8), notes: 'Peso abaixo do ideal' },
    ]},
  }});

  // Bela: 1 prenhez (Trovão) — perfil intermediário
  // Parto: Trovão daysAgo(370) → nasc daysAgo(90) [370-280=90]
  const bela = await prisma.animal.create({ data: {
    identifier: '0025', name: 'Bela',
    species: 'cattle', sex: 'female', breed: 'Sindi',
    birthDate: new Date('2020-11-08'),
    bodyConditionScore: 3, reproductiveDiseaseHistory: false,
    pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
    lastBirthDate: daysAgo(90), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 352, weighingDate: daysAgo(270) },
      { weightKg: 368, weighingDate: daysAgo(90), notes: 'Pós-parto' },
      { weightKg: 381, weighingDate: daysAgo(7) },
    ]},
  }});

  // ─── FÊMEAS OVINAS (gestação ~152 dias) ───────────────────────────────────────

  // Branca: 2 prenhezes (Carneiro42×2, 1º parto gemelar)
  // Parto 1: daysAgo(400) → nasc daysAgo(248) [400-152=248]
  // Parto 2: daysAgo(247) → nasc daysAgo(95)  [247-152=95] ← lastBirthDate
  const branca = await prisma.animal.create({ data: {
    identifier: '0030', name: 'Branca',
    species: 'sheep', sex: 'female', breed: 'Santa Inês',
    birthDate: new Date('2022-01-10'), sireId: carneiro42.id, damId: canela.id,
    bodyConditionScore: 4, reproductiveDiseaseHistory: false,
    pregnancyHistory: 2, birthCount: 2, abortionCount: 0,
    lastBirthDate: daysAgo(95), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', birthWeight: 4.2, weaningWeight: 22.0, preWeaningWeightGain: 0.24,
    photoUrl: animalPhoto('🐑', 'Branca', 'Santa Inês', '#52796F'),
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 42, weighingDate: daysAgo(360) },
      { weightKg: 46, weighingDate: daysAgo(240) },
      { weightKg: 48, weighingDate: daysAgo(95), notes: 'Pós-parto ciclo 2' },
      { weightKg: 50, weighingDate: daysAgo(40) },
      { weightKg: 52, weighingDate: daysAgo(8), notes: 'Pré-IATF' },
    ]},
  }});

  // Serena: 2 prenhezes (Carneiro42×2) + pendente — alto risco (ECC 2, baixo peso, pós-parto 35d)
  // Parto 1: daysAgo(350) → nasc daysAgo(198) [350-152=198]
  // Parto 2: daysAgo(187) → nasc daysAgo(35)  [187-152=35] ← lastBirthDate
  const serena = await prisma.animal.create({ data: {
    identifier: '0031', name: 'Serena',
    species: 'sheep', sex: 'female', breed: 'Morada Nova',
    birthDate: new Date('2021-08-20'),
    bodyConditionScore: 2, reproductiveDiseaseHistory: false,
    pregnancyHistory: 2, birthCount: 2, abortionCount: 0,
    lastBirthDate: daysAgo(35), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai',
    photoUrl: animalPhoto('🐑', 'Serena', 'Morada Nova', '#6B705C'),
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 44, weighingDate: daysAgo(200) },
      { weightKg: 41, weighingDate: daysAgo(80), notes: 'Perda de peso pós-parto' },
      { weightKg: 37, weighingDate: daysAgo(6), notes: 'Baixo peso — suplementação urgente' },
    ]},
  }});

  // Luna: nulípara, 1 falha (Faraó) — demo ao vivo
  const luna = await prisma.animal.create({ data: {
    identifier: '0032', name: 'Luna',
    species: 'sheep', sex: 'female', breed: 'Dorper',
    birthDate: new Date('2024-03-15'),
    bodyConditionScore: 4, reproductiveDiseaseHistory: false,
    pregnancyHistory: 0, birthCount: 0, abortionCount: 0,
    reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 40, weighingDate: daysAgo(60) },
      { weightKg: 45, weighingDate: daysAgo(20) },
      { weightKg: 48, weighingDate: daysAgo(4), notes: 'Pré-protocolo' },
    ]},
  }});

  // Antônia: 1 falha (Faraó) + 1 prenhez (Carneiro42)
  // Parto: Carneiro42 daysAgo(207) → nasc daysAgo(55) [207-152=55] ← lastBirthDate
  const antonia = await prisma.animal.create({ data: {
    identifier: '0033', name: 'Antônia',
    species: 'sheep', sex: 'female', breed: 'Santa Inês',
    birthDate: new Date('2021-06-05'),
    bodyConditionScore: 3, reproductiveDiseaseHistory: false,
    pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
    lastBirthDate: daysAgo(55), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 46, weighingDate: daysAgo(180) },
      { weightKg: 44, weighingDate: daysAgo(55), notes: 'Pós-parto' },
      { weightKg: 46, weighingDate: daysAgo(5) },
    ]},
  }});

  // ─── FÊMEAS CAPRINAS (gestação ~150 dias) ─────────────────────────────────────

  // Nuvem: 2 prenhezes (King Boer×2) — CENÁRIO MOBILE DA DEMO
  // Parto 1: daysAgo(430) → nasc daysAgo(280) [430-150=280]
  // Parto 2: daysAgo(230) → nasc daysAgo(80)  [230-150=80] ← lastBirthDate
  const nuvem = await prisma.animal.create({ data: {
    identifier: '0040', name: 'Nuvem',
    species: 'goat', sex: 'female', breed: 'Boer',
    birthDate: new Date('2022-04-05'),
    bodyConditionScore: 4, reproductiveDiseaseHistory: false,
    pregnancyHistory: 2, birthCount: 2, abortionCount: 0,
    lastBirthDate: daysAgo(80), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', birthWeight: 3.8, weaningWeight: 18.0, preWeaningWeightGain: 0.19,
    photoUrl: animalPhoto('🐐', 'Nuvem', 'Boer', '#344E41'),
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 32, weighingDate: daysAgo(360) },
      { weightKg: 35, weighingDate: daysAgo(240) },
      { weightKg: 36, weighingDate: daysAgo(80), notes: 'Pós-parto ciclo 2' },
      { weightKg: 38, weighingDate: daysAgo(40) },
      { weightKg: 40, weighingDate: daysAgo(5), notes: 'Pré-IATF' },
    ]},
  }});

  // Flor: 1 prenhez (King Boer) + 1 falha (King Boer) + pendente (Zeus)
  // Parto: King Boer daysAgo(280) → nasc daysAgo(130) [280-150=130] ← lastBirthDate
  const flor = await prisma.animal.create({ data: {
    identifier: '0041', name: 'Flor',
    species: 'goat', sex: 'female', breed: 'Anglonubiana',
    birthDate: new Date('2022-08-12'),
    bodyConditionScore: 3, reproductiveDiseaseHistory: false,
    pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
    lastBirthDate: daysAgo(130), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 34, weighingDate: daysAgo(180) },
      { weightKg: 35, weighingDate: daysAgo(130), notes: 'Pós-parto' },
      { weightKg: 37, weighingDate: daysAgo(7) },
    ]},
  }});

  // Rosa: 0 prenhezes, 1 falha (Zeus) — alto risco (doença + ECC 2 + baixo peso)
  const rosa = await prisma.animal.create({ data: {
    identifier: '0042', name: 'Rosa',
    species: 'goat', sex: 'female', breed: 'Canindé',
    birthDate: new Date('2021-12-20'),
    bodyConditionScore: 2, reproductiveDiseaseHistory: true,
    pregnancyHistory: 0, birthCount: 0, abortionCount: 0,
    reproductiveStatus: 'Ready', producer: 'Fazenda Uruguai',
    photoUrl: animalPhoto('🐐', 'Rosa', 'Canindé', '#7F4F24'),
    farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 32, weighingDate: daysAgo(180), notes: 'Peso abaixo do ideal' },
      { weightKg: 30, weighingDate: daysAgo(60), notes: 'Perda de peso — investigar' },
      { weightKg: 28, weighingDate: daysAgo(4), notes: '20% abaixo do mínimo' },
    ]},
  }});

  // Safira: 1 prenhez (King Boer) — pós-parto recente 30 dias
  // Parto: King Boer daysAgo(180) → nasc daysAgo(30) [180-150=30] ← lastBirthDate
  const safira = await prisma.animal.create({ data: {
    identifier: '0043', name: 'Safira',
    species: 'goat', sex: 'female', breed: 'Anglo-nubiana',
    birthDate: new Date('2022-10-18'),
    bodyConditionScore: 3, reproductiveDiseaseHistory: false,
    pregnancyHistory: 1, birthCount: 1, abortionCount: 0,
    lastBirthDate: daysAgo(30), reproductiveStatus: 'Ready',
    producer: 'Fazenda Uruguai', farmId, updatedAt: new Date(),
    weighings: { create: [
      { weightKg: 33, weighingDate: daysAgo(90) },
      { weightKg: 35, weighingDate: daysAgo(30), notes: 'Pós-parto' },
      { weightKg: 36, weighingDate: daysAgo(6) },
    ]},
  }});

  // ─── EVENTOS REPRODUTIVOS ─────────────────────────────────────────────────────
  // Cada inseminação positiva tem um evento de birth correspondente.
  // Os contadores dos reprodutores e fêmeas refletem exatamente esses eventos.

  // MIMOSA — 3 prenhezes: Bumbá daysAgo(1350), Bumbá daysAgo(800), Trovão daysAgo(550)
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: mimosa.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-101', lot: 'Lote 01', reproductiveProtocol: 'IATF', eventDate: daysAgo(1350), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(1320) },
    { animalId: mimosa.id, eventType: 'birth', eventDate: daysAgo(1070), pregnancyDiagnosis: 'positive', result: 'Parto normal — bezerra fêmea' },
    { animalId: mimosa.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-102', lot: 'Lote 02', reproductiveProtocol: 'IATF', eventDate: daysAgo(800), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(770) },
    { animalId: mimosa.id, eventType: 'birth', eventDate: daysAgo(520), pregnancyDiagnosis: 'positive', result: 'Parto normal — bezerro macho' },
    { animalId: mimosa.id, sireId: trovao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore LEM-01', lot: 'Lote 03', reproductiveProtocol: 'IATF', eventDate: daysAgo(550), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(520) },
    { animalId: mimosa.id, eventType: 'birth', eventDate: daysAgo(270), pregnancyDiagnosis: 'positive', result: 'Parto normal — bezerro macho saudável' },
  ]});

  // GAROA — 1 prenhez Barão + pendente 28 dias (DEMO: diagnóstico ao vivo)
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: garoa.id, sireId: barao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Brahman REY-04', lot: 'Lote Primavera', reproductiveProtocol: 'Ovsynch', eventDate: daysAgo(400), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(370) },
    { animalId: garoa.id, eventType: 'birth', eventDate: daysAgo(120), pregnancyDiagnosis: 'positive', result: 'Parto normal — bezerro macho' },
    { animalId: garoa.id, sireId: barao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Brahman REY-05', lot: 'Lote Outono', reproductiveProtocol: 'Ovsynch', eventDate: daysAgo(28), pregnancyDiagnosis: 'pending', notes: 'Aguardando diagnóstico — ideal confirmar aos 30 dias' },
  ]});

  // ARREPIADA — 4 prenhezes Bumbá (3 partos + atualmente prenhe)
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: arrepiada.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-101', lot: 'Lote 01', reproductiveProtocol: 'IATF', eventDate: daysAgo(1080), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(1050) },
    { animalId: arrepiada.id, eventType: 'birth', eventDate: daysAgo(800), pregnancyDiagnosis: 'positive', result: 'Parto normal' },
    { animalId: arrepiada.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-102', lot: 'Lote 02', reproductiveProtocol: 'IATF', eventDate: daysAgo(780), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(750) },
    { animalId: arrepiada.id, eventType: 'birth', eventDate: daysAgo(500), pregnancyDiagnosis: 'positive', result: 'Parto normal' },
    { animalId: arrepiada.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-102', lot: 'Lote 03', reproductiveProtocol: 'IATF', eventDate: daysAgo(560), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(530) },
    { animalId: arrepiada.id, eventType: 'birth', eventDate: daysAgo(280), pregnancyDiagnosis: 'positive', result: 'Parto normal — bezerra fêmea' },
    { animalId: arrepiada.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-103', lot: 'Lote 04', reproductiveProtocol: 'IATF', eventDate: daysAgo(120), pregnancyDiagnosis: 'positive', result: 'Prenha confirmada', confirmationDate: daysAgo(90), notes: 'Gestação em andamento' },
  ]});

  // ESTRELA — 1 prenhez Barão + falha Bumbá (inseminada com apenas 25 dias pós-parto)
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: estrela.id, sireId: barao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Brahman REY-04', lot: 'Lote Novilhas', reproductiveProtocol: 'IATF', eventDate: daysAgo(335), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(305) },
    { animalId: estrela.id, eventType: 'birth', eventDate: daysAgo(55), pregnancyDiagnosis: 'positive', result: 'Parto normal — bezerro macho' },
    { animalId: estrela.id, sireId: bumba.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore MAX-103', lot: 'Lote 04', reproductiveProtocol: 'IATF com eCG', eventDate: daysAgo(30), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(5), notes: 'Falha — inseminada com apenas 25 dias pós-parto' },
  ]});

  // PRINCESA — 1 prenhez Trovão + falha Barão + falha Trovão
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: princesa.id, sireId: trovao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore LEM-01', lot: 'Lote 02', reproductiveProtocol: 'IATF', eventDate: daysAgo(380), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(350) },
    { animalId: princesa.id, eventType: 'birth', eventDate: daysAgo(100), pregnancyDiagnosis: 'positive', result: 'Parto normal' },
    { animalId: princesa.id, sireId: barao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Brahman REY-05', lot: 'Lote Outono', reproductiveProtocol: 'IATF com eCG', eventDate: daysAgo(200), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(170) },
    { animalId: princesa.id, sireId: trovao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore LEM-02', lot: 'Lote 04', reproductiveProtocol: 'IATF com eCG', eventDate: daysAgo(60), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(30), notes: 'ECC 2/5 e doença reprodutiva — receptividade comprometida' },
  ]});

  // BELA — 1 prenhez Trovão
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: bela.id, sireId: trovao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Nelore LEM-01', lot: 'Lote 02', reproductiveProtocol: 'IATF', eventDate: daysAgo(370), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(340) },
    { animalId: bela.id, eventType: 'birth', eventDate: daysAgo(90), pregnancyDiagnosis: 'positive', result: 'Parto normal — bezerra fêmea' },
  ]});

  // BRANCA — 2 prenhezes Carneiro42 (1º parto gemelar)
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: branca.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Dorper DR-22', lot: 'Lote Ovelhas 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(400), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(375) },
    { animalId: branca.id, eventType: 'birth', eventDate: daysAgo(248), pregnancyDiagnosis: 'positive', result: 'Parto gemelar — 2 cordeiros saudáveis' },
    { animalId: branca.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Dorper DR-22', lot: 'Lote Ovelhas 2', reproductiveProtocol: 'IATF', eventDate: daysAgo(247), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(222) },
    { animalId: branca.id, eventType: 'birth', eventDate: daysAgo(95), pregnancyDiagnosis: 'positive', result: 'Parto normal — cordeira fêmea' },
  ]});

  // SERENA — 2 prenhezes Carneiro42 + pendente (risco alto)
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: serena.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Morada Nova MN-01', lot: 'Lote Ovelhas 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(350), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(325) },
    { animalId: serena.id, eventType: 'birth', eventDate: daysAgo(198), pregnancyDiagnosis: 'positive', result: 'Parto normal' },
    { animalId: serena.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Morada Nova MN-02', lot: 'Lote Ovelhas 2', reproductiveProtocol: 'IATF', eventDate: daysAgo(187), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(162) },
    { animalId: serena.id, eventType: 'birth', eventDate: daysAgo(35), pregnancyDiagnosis: 'positive', result: 'Parto normal' },
    { animalId: serena.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Morada Nova MN-03', lot: 'Lote Ovelhas 3', reproductiveProtocol: 'Ovsynch', eventDate: daysAgo(20), pregnancyDiagnosis: 'pending', notes: 'ECC 2/5 e 37 kg — risco elevado' },
  ]});

  // ANTÔNIA — falha Faraó + prenhez Carneiro42
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: antonia.id, sireId: farao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Ile de France IF-01', lot: 'Lote Ovelhas 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(400), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(375) },
    { animalId: antonia.id, sireId: carneiro42.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Dorper DR-22', lot: 'Lote Ovelhas 2', reproductiveProtocol: 'IATF', eventDate: daysAgo(207), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(182) },
    { animalId: antonia.id, eventType: 'birth', eventDate: daysAgo(55), pregnancyDiagnosis: 'positive', result: 'Parto normal — cordeiro macho' },
  ]});

  // LUNA — 1 falha Faraó (nulípara)
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: luna.id, sireId: farao.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Ile de France IF-02', lot: 'Lote Ovelhas Jovens', reproductiveProtocol: 'IATF', eventDate: daysAgo(90), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(65), notes: 'Primeira tentativa — nulípara jovem' },
  ]});

  // NUVEM — 2 prenhezes King Boer
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: nuvem.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer KN-01', lot: 'Lote Caprinos 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(430), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(405) },
    { animalId: nuvem.id, eventType: 'birth', eventDate: daysAgo(280), pregnancyDiagnosis: 'positive', result: 'Parto normal — cabrito macho 3,8 kg' },
    { animalId: nuvem.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer KN-02', lot: 'Lote Caprinos 2', reproductiveProtocol: 'IATF', eventDate: daysAgo(230), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(205) },
    { animalId: nuvem.id, eventType: 'birth', eventDate: daysAgo(80), pregnancyDiagnosis: 'positive', result: 'Parto normal — 2 cabritas fêmeas' },
  ]});

  // FLOR — prenhez King Boer + falha King Boer + pendente Zeus
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: flor.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer KN-01', lot: 'Lote Caprinos 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(280), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(255) },
    { animalId: flor.id, eventType: 'birth', eventDate: daysAgo(130), pregnancyDiagnosis: 'positive', result: 'Parto normal — cabrita fêmea' },
    { animalId: flor.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer KN-02', lot: 'Lote Caprinos 2', reproductiveProtocol: 'IATF com eCG', eventDate: daysAgo(140), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(115), notes: 'Reabsorção embrionária precoce' },
    { animalId: flor.id, sireId: zeusBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer ZB-01', lot: 'Lote Caprinos 3', reproductiveProtocol: 'Ressincronização', eventDate: daysAgo(25), pregnancyDiagnosis: 'pending', notes: 'Terceira tentativa — reprodutor alternado' },
  ]});

  // ROSA — 1 falha Zeus
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: rosa.id, sireId: zeusBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer ZB-01', lot: 'Lote Caprinos Jovens', reproductiveProtocol: 'IATF', eventDate: daysAgo(100), pregnancyDiagnosis: 'conception_failure', result: 'Vazia', confirmationDate: daysAgo(75), notes: 'Doença reprodutiva ativa — condição insuficiente' },
  ]});

  // SAFIRA — 1 prenhez King Boer
  await prisma.reproductiveEvent.createMany({ data: [
    { animalId: safira.id, sireId: kingBoer.id, eventType: 'artificial_insemination', inseminator: 'Dr. Fernando Lima', semenUsed: 'Boer KN-01', lot: 'Lote Caprinos 1', reproductiveProtocol: 'IATF', eventDate: daysAgo(180), pregnancyDiagnosis: 'positive', result: 'Prenha', confirmationDate: daysAgo(155) },
    { animalId: safira.id, eventType: 'birth', eventDate: daysAgo(30), pregnancyDiagnosis: 'positive', result: 'Parto normal — cabrito macho' },
  ]});

  // ─── PREDIÇÕES PRÉ-SALVAS ─────────────────────────────────────────────────────

  await prisma.prediction.create({ data: {
    animalId: mimosa.id, sireId: bumba.id, analysisType: 'pregnancy',
    pregnancyProbability: 84, fertilityScore: 87, riskLevel: 'low', geneticCompatibility: 92,
    positiveFactors: [
      'Peso 461 kg — 21% acima do limiar Nelore (380 kg)',
      'ECC 4/5 — balanço energético positivo',
      '3 partos sem abortos — fertilidade comprovada',
      '270 dias pós-parto — involução uterina completa',
      'Bumbá (0005): 86% taxa real, 6 prenhezes em 7 inseminações registradas',
    ],
    alerts: ['Estação seca — manter suplementação proteico-energética'],
    recommendations: ['Suplementação mineral durante a seca', 'Ultrassom 28-35 dias pós-IATF', 'Sombreamento nas horas de maior calor'],
    aiInsight: 'Mimosa é a candidata mais sólida do lote bovino. Com ECC 4/5 e 461 kg, o balanço energético favorece o pico de LH e a resposta ovariana ao protocolo IATF. Seus 3 partos sem abortos confirmam integridade do trato reprodutivo. O Bumbá (0005) complementa bem: 86% de taxa real em 7 inseminações registradas nesta fazenda. Único ponto de atenção: a seca pode reduzir disponibilidade de forragem nas semanas pós-inseminação — suplementação proteica é determinante.',
    protocol: 'IATF', ambientTemperature: 26, season: 'dry',
    aiProfile: 'standard' as any, inputTokens: 335, outputTokens: 298, createdAt: daysAgo(3),
  }});

  await prisma.prediction.create({ data: {
    animalId: estrela.id, sireId: trovao.id, analysisType: 'pregnancy',
    pregnancyProbability: 52, fertilityScore: 40, riskLevel: 'moderate', geneticCompatibility: 72,
    positiveFactors: ['Peso 385 kg — adequado para Girolando', 'ECC 3/5 — condição aceitável', 'Trovão (0009): 75% taxa real'],
    alerts: ['Pós-parto de 55 dias — involução possivelmente incompleta (ideal ≥ 60 dias)', 'Falha recente com apenas 25 dias pós-parto', 'Estação seca'],
    recommendations: ['Aguardar mais 10-15 dias para completar involução', 'Manter suplementação proteico-energética'],
    aiInsight: 'Estrela tem histórico que explica o risco moderado: a inseminação de 30 dias atrás foi feita com apenas 25 dias pós-parto — involução incompleta — resultando em falha de concepção. Com 55 dias de pós-parto agora, está no limite do intervalo ideal para Girolando (60 dias). Aguardar mais 10-15 dias melhora consideravelmente as chances.',
    protocol: 'IATF com eCG', ambientTemperature: 26, season: 'dry',
    aiProfile: 'standard' as any, inputTokens: 332, outputTokens: 285, createdAt: daysAgo(2),
  }});

  await prisma.prediction.create({ data: {
    animalId: branca.id, sireId: carneiro42.id, analysisType: 'pregnancy',
    pregnancyProbability: 79, fertilityScore: 76, riskLevel: 'low', geneticCompatibility: 88,
    positiveFactors: ['Peso 52 kg — acima do limiar Santa Inês (45 kg)', 'ECC 4/5', '2 partos — incluindo parto gemelar', '95 dias pós-parto', 'Carneiro 42 (0007): 83% taxa real em 6 inseminações'],
    alerts: ['Estação seca — suplementação mineral recomendada'],
    recommendations: ['Suplementação (fósforo, cobre)', 'Ultrassom 25-30 dias pós-IATF'],
    aiInsight: 'Branca é a candidata ovina mais consistente: parto gemelar no 1º ciclo confirma alta prolificidade, ECC 4/5 aos 52 kg indica reserva energética suficiente. O Carneiro 42 (0007) tem 83% de taxa real em 6 inseminações registradas nesta fazenda. Santa Inês é naturalmente adaptada ao semiárido, o que reduz o impacto da seca na ciclicidade.',
    protocol: 'IATF', ambientTemperature: 26, season: 'dry',
    aiProfile: 'standard' as any, inputTokens: 330, outputTokens: 280, createdAt: daysAgo(5),
  }});

  await prisma.prediction.create({ data: {
    animalId: serena.id, sireId: carneiro42.id, analysisType: 'pregnancy',
    pregnancyProbability: 44, fertilityScore: 22, riskLevel: 'high', geneticCompatibility: 88,
    positiveFactors: ['Carneiro 42 (0007): 83% taxa real', 'Protocolo Ovsynch — sincronização eficiente'],
    alerts: ['Peso 37 kg — 18% abaixo do mínimo Morada Nova (45 kg)', 'ECC 2/5 — suprime eixo reprodutivo', 'Pós-parto de apenas 35 dias (ideal ≥ 45)', 'Estação seca — agrava déficit nutricional'],
    recommendations: ['Postergar mínimo 15 dias', 'Suplementação intensiva: 200g milho + 50g ureia protegida', 'Meta: 42 kg antes da próxima tentativa'],
    aiInsight: 'Serena apresenta três fatores críticos simultâneos: peso 18% abaixo do mínimo, ECC 2/5 e apenas 35 dias de pós-parto. Em Morada Nova, o eixo hipotálamo-hipófise-gonadal é suprimido quando ECC cai abaixo de 2,5 — comprometendo a ovulação mesmo com protocolo hormonal. Inseminação neste ciclo tem baixa eficiência. Recomendo postergar e intensificar a nutrição.',
    protocol: 'Ovsynch', ambientTemperature: 26, season: 'dry',
    aiProfile: 'standard' as any, inputTokens: 331, outputTokens: 292, createdAt: daysAgo(2),
  }});

  await prisma.prediction.create({ data: {
    animalId: nuvem.id, sireId: kingBoer.id, analysisType: 'pregnancy',
    pregnancyProbability: 77, fertilityScore: 74, riskLevel: 'low', geneticCompatibility: 90,
    positiveFactors: ['Peso 40 kg — adequado para Boer (mínimo 35 kg)', 'ECC 4/5', '2 partos sem abortos — parto duplo no 2º ciclo', '80 dias pós-parto', 'King Boer (0008): 80% taxa real em 5 inseminações'],
    alerts: ['Estação seca — suplementação mineral recomendada'],
    recommendations: ['Volumoso de qualidade na pré-inseminação', 'Ultrassom 25 dias pós-IATF', 'Verificar mineralização (fósforo, vitamina E)'],
    aiInsight: 'Nuvem tem o perfil mais consistente das caprinas. Boer com parto duplo no ciclo 2, ECC 4/5 e 80 dias de pós-parto — todas as condições hormonais favoráveis para IATF. O King Boer (0008) tem 80% de taxa real em 5 inseminações registradas nesta fazenda — compatibilidade excelente.',
    protocol: 'IATF', ambientTemperature: 26, season: 'dry',
    aiProfile: 'standard' as any, inputTokens: 328, outputTokens: 272, createdAt: daysAgo(4),
  }});

  await prisma.prediction.create({ data: {
    animalId: rosa.id, sireId: kingBoer.id, analysisType: 'pregnancy',
    pregnancyProbability: 38, fertilityScore: 10, riskLevel: 'high', geneticCompatibility: 90,
    positiveFactors: ['King Boer (0008): 80% taxa real'],
    alerts: ['Peso 28 kg — 20% abaixo do mínimo Canindé (35 kg)', 'ECC 2/5 — comprometimento severo', 'Doença reprodutiva confirmada', 'Falha na concepção há 100 dias sem melhora', 'Estação seca — agrava déficit nutricional'],
    recommendations: ['NÃO inseminar neste ciclo', 'Avaliação ginecológica obrigatória', 'Meta: ECC 3/5 e mínimo 36 kg', 'Isolamento preventivo do lote'],
    aiInsight: 'Rosa apresenta o quadro mais crítico do lote caprino. Doença reprodutiva ativa + ECC 2/5 + peso 20% abaixo do mínimo Canindé indicam que o organismo não tem reservas para sustentar uma gestação. A falha registrada há 100 dias confirma que a condição não melhorou. Inseminar agora aumenta o risco de aborto e piora o quadro. Tratamento veterinário e recuperação corporal são prioridade.',
    protocol: 'IATF', ambientTemperature: 26, season: 'dry',
    aiProfile: 'standard' as any, inputTokens: 332, outputTokens: 305, createdAt: daysAgo(1),
  }});

  // ─── RESUMO ───────────────────────────────────────────────────────────────────
  const [totalAnimals, totalEvents, totalPredictions] = await Promise.all([
    prisma.animal.count({ where: { farmId } }),
    prisma.reproductiveEvent.count({ where: { animal: { farmId } } }),
    prisma.prediction.count({ where: { animal: { farmId } } }),
  ]);

  console.log('✅ Seed concluído!\n');
  console.log('🔑 demo@inseminai.com.br / Demo@2026');
  console.log('🏡 Fazenda Uruguai — Crateús/CE');
  console.log(`📊 ${totalAnimals} animais · ${totalEvents} eventos · ${totalPredictions} predições\n`);
  console.log('REPRODUTORES (contadores = eventos no banco):');
  console.log('  0005 Bumbá       BOV Nelore    7 ins / 6 prenhezes → score 86');
  console.log('  0006 Barão       BOV Brahman   4 ins / 2 prenhezes → score 50');
  console.log('  0009 Trovão      BOV Nelore    4 ins / 3 prenhezes → score 75');
  console.log('  0007 Carneiro 42 OVI Dorper    6 ins / 5 prenhezes → score 83');
  console.log('  0013 Faraó       OVI Ile de Fr 2 ins / 0 prenhezes → score 0');
  console.log('  0008 King Boer   CAP Boer      5 ins / 4 prenhezes → score 80');
  console.log('  0014 Zeus        CAP Boer      2 ins / 0 prenhezes → score 0\n');
  console.log('CENÁRIOS DA DEMO:');
  console.log('  0020 Mimosa   BOV Nelore    → 84% baixo  [ao vivo]');
  console.log('  0023 Estrela  BOV Girolando → 52% moder. [pré-salvo]');
  console.log('  0030 Branca   OVI Sta Inês  → 79% baixo  [pré-salvo]');
  console.log('  0031 Serena   OVI Morada N. → 44% alto   [pré-salvo]');
  console.log('  0040 Nuvem    CAP Boer      → 77% baixo  [mobile]');
  console.log('  0042 Rosa     CAP Canindé   → 38% alto   [pré-salvo]');
  console.log('  0021 Garoa    BOV Brahman   → pendente   [ciclo completo ao vivo]');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
