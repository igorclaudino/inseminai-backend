import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@insemiai.com' },
    update: {},
    create: { name: 'Demo Producer', email: 'demo@insemiai.com', password: passwordHash },
  });

  const farm = await prisma.farm.upsert({
    where: { id: 'farm-demo-001' },
    update: {},
    create: {
      id: 'farm-demo-001',
      name: 'Sao Joao Farm',
      city: 'Crateús',
      state: 'CE',
      averagePregnancyRate: 68,
      ownerId: user.id,
    },
  });

  // Create admin FarmMember for the owner
  await prisma.farmMember.upsert({
    where: { farmId_userId: { farmId: farm.id, userId: user.id } },
    update: {},
    create: { farmId: farm.id, userId: user.id, role: 'admin' },
  });

  // ─── Breeders ────────────────────────────────────────────────────────────────

  await Promise.all([
    prisma.breeder.upsert({
      where: { id: 'breeder-nelore-001' },
      update: {},
      create: {
        id: 'breeder-nelore-001',
        name: 'Imperador',
        species: 'cattle',
        breed: 'Nelore',
        fertilityScore: 85,
        estimatedScore: 85,
        totalInseminations: 0,
        pregnancies: 0,
        farmId: farm.id,
      },
    }),
    prisma.breeder.upsert({
      where: { id: 'breeder-angus-001' },
      update: {},
      create: {
        id: 'breeder-angus-001',
        name: 'Black Diamond',
        species: 'cattle',
        breed: 'Angus',
        fertilityScore: 82,
        estimatedScore: 82,
        totalInseminations: 12,
        pregnancies: 9,
        farmId: farm.id,
      },
    }),
    prisma.breeder.upsert({
      where: { id: 'breeder-gir-001' },
      update: {},
      create: {
        id: 'breeder-gir-001',
        name: 'Rajado do Sertão',
        species: 'cattle',
        breed: 'Gir',
        fertilityScore: 58,
        estimatedScore: 78,
        totalInseminations: 8,
        pregnancies: 3,
        farmId: farm.id,
      },
    }),
    prisma.breeder.upsert({
      where: { id: 'breeder-santa-001' },
      update: {},
      create: {
        id: 'breeder-santa-001',
        name: 'Zeus',
        species: 'cattle',
        breed: 'Santa Gertrudis',
        fertilityScore: 78,
        estimatedScore: 78,
        totalInseminations: 0,
        pregnancies: 0,
        farmId: farm.id,
      },
    }),
    prisma.breeder.upsert({
      where: { id: 'breeder-dorper-001' },
      update: {},
      create: {
        id: 'breeder-dorper-001',
        name: 'Champion Dorper',
        species: 'sheep',
        breed: 'Dorper',
        fertilityScore: 88,
        estimatedScore: 88,
        totalInseminations: 15,
        pregnancies: 13,
        farmId: farm.id,
      },
    }),
    prisma.breeder.upsert({
      where: { id: 'breeder-santaines-001' },
      update: {},
      create: {
        id: 'breeder-santaines-001',
        name: 'Nordestino',
        species: 'sheep',
        breed: 'Santa Inês',
        fertilityScore: 85,
        estimatedScore: 85,
        totalInseminations: 10,
        pregnancies: 8,
        farmId: farm.id,
      },
    }),
    prisma.breeder.upsert({
      where: { id: 'breeder-boer-001' },
      update: {},
      create: {
        id: 'breeder-boer-001',
        name: 'King Boer',
        species: 'goat',
        breed: 'Boer',
        fertilityScore: 85,
        estimatedScore: 85,
        totalInseminations: 20,
        pregnancies: 16,
        farmId: farm.id,
      },
    }),
    prisma.breeder.upsert({
      where: { id: 'breeder-anglonubian-001' },
      update: {},
      create: {
        id: 'breeder-anglonubian-001',
        name: 'Sultan',
        species: 'goat',
        breed: 'Anglo-Nubian',
        fertilityScore: 72,
        estimatedScore: 79,
        totalInseminations: 6,
        pregnancies: 3,
        farmId: farm.id,
      },
    }),
  ]);

  // ─── Animals ─────────────────────────────────────────────────────────────────

  await Promise.all([

    // CATTLE ───────────────────────────────────────────────────────────────────

    // Ideal profile: optimal weight, postpartum ok, clean history → high probability
    prisma.animal.upsert({
      where: { id: 'animal-cow-001' },
      update: {},
      create: {
        id: 'animal-cow-001',
        identifier: 'BOV-001',
        species: 'cattle',
        name: 'Mimosa',
        breed: 'Nelore',
        sex: 'female',
        birthDate: new Date('2021-03-15'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 2,
        birthCount: 2,
        abortionCount: 0,
        lastBirthDate: daysAgo(80),
        bodyConditionScore: 4,
        farmId: farm.id,
        weighings: {
          create: [
            { weightKg: 410, weighingDate: daysAgo(180) },
            { weightKg: 430, weighingDate: daysAgo(90) },
            { weightKg: 445, weighingDate: daysAgo(5) },
          ],
        },
      },
    }),

    // Risk profile: short postpartum + abortion history → moderate probability
    prisma.animal.upsert({
      where: { id: 'animal-cow-002' },
      update: {},
      create: {
        id: 'animal-cow-002',
        identifier: 'BOV-002',
        species: 'cattle',
        name: 'Estrela',
        breed: 'Girolando',
        sex: 'female',
        birthDate: new Date('2022-07-20'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 1,
        birthCount: 1,
        abortionCount: 1,
        lastBirthDate: daysAgo(30),
        bodyConditionScore: 3,
        reproductiveDiseaseHistory: false,
        farmId: farm.id,
        weighings: {
          create: [
            { weightKg: 370, weighingDate: daysAgo(60) },
            { weightKg: 390, weighingDate: daysAgo(10) },
          ],
        },
      },
    }),

    // Critical profile: low BCS + reproductive disease + underweight + prior abortion
    prisma.animal.upsert({
      where: { id: 'animal-cow-003' },
      update: {},
      create: {
        id: 'animal-cow-003',
        identifier: 'BOV-003',
        species: 'cattle',
        name: 'Perola',
        breed: 'Brahman',
        sex: 'female',
        birthDate: new Date('2020-11-02'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 1,
        birthCount: 0,
        abortionCount: 2,
        bodyConditionScore: 2,
        reproductiveDiseaseHistory: true,
        farmId: farm.id,
        weighings: {
          create: [
            { weightKg: 340, weighingDate: daysAgo(30) },
            { weightKg: 355, weighingDate: daysAgo(5) },
          ],
        },
      },
    }),

    // Young nulliparous: never calved, good condition, borderline weight → moderate
    prisma.animal.upsert({
      where: { id: 'animal-cow-004' },
      update: {},
      create: {
        id: 'animal-cow-004',
        identifier: 'BOV-004',
        species: 'cattle',
        name: 'Aurora',
        breed: 'Senepol',
        sex: 'female',
        birthDate: new Date('2023-05-18'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 0,
        birthCount: 0,
        abortionCount: 0,
        bodyConditionScore: 3,
        farmId: farm.id,
        weighings: {
          create: [{ weightKg: 385, weighingDate: daysAgo(7) }],
        },
      },
    }),

    // SHEEP ────────────────────────────────────────────────────────────────────

    // Experienced ewe, excellent history → high probability
    prisma.animal.upsert({
      where: { id: 'animal-ewe-001' },
      update: {},
      create: {
        id: 'animal-ewe-001',
        identifier: 'OVI-001',
        species: 'sheep',
        name: 'Branca',
        breed: 'Dorper',
        sex: 'female',
        birthDate: new Date('2022-01-10'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 3,
        birthCount: 3,
        abortionCount: 0,
        lastBirthDate: daysAgo(90),
        bodyConditionScore: 4,
        farmId: farm.id,
        weighings: {
          create: [
            { weightKg: 48, weighingDate: daysAgo(120) },
            { weightKg: 52, weighingDate: daysAgo(10) },
          ],
        },
      },
    }),

    // Ewe with low BCS and short postpartum → moderate/high risk
    prisma.animal.upsert({
      where: { id: 'animal-ewe-002' },
      update: {},
      create: {
        id: 'animal-ewe-002',
        identifier: 'OVI-002',
        species: 'sheep',
        name: 'Serena',
        breed: 'Santa Inês',
        sex: 'female',
        birthDate: new Date('2022-09-14'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 1,
        birthCount: 1,
        abortionCount: 0,
        lastBirthDate: daysAgo(40),
        bodyConditionScore: 2,
        farmId: farm.id,
        weighings: {
          create: [{ weightKg: 38, weighingDate: daysAgo(5) }],
        },
      },
    }),

    // Young nulliparous ewe, good condition → moderate (no history)
    prisma.animal.upsert({
      where: { id: 'animal-ewe-003' },
      update: {},
      create: {
        id: 'animal-ewe-003',
        identifier: 'OVI-003',
        species: 'sheep',
        name: 'Lua',
        breed: 'Morada Nova',
        sex: 'female',
        birthDate: new Date('2024-02-20'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 0,
        birthCount: 0,
        abortionCount: 0,
        bodyConditionScore: 4,
        farmId: farm.id,
        weighings: {
          create: [{ weightKg: 47, weighingDate: daysAgo(3) }],
        },
      },
    }),

    // GOATS ────────────────────────────────────────────────────────────────────

    // Experienced doe, excellent history → high probability
    prisma.animal.upsert({
      where: { id: 'animal-doe-001' },
      update: {},
      create: {
        id: 'animal-doe-001',
        identifier: 'CAP-001',
        species: 'goat',
        name: 'Nuvem',
        breed: 'Boer',
        sex: 'female',
        birthDate: new Date('2022-04-05'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 2,
        birthCount: 2,
        abortionCount: 0,
        lastBirthDate: daysAgo(75),
        bodyConditionScore: 4,
        farmId: farm.id,
        weighings: {
          create: [
            { weightKg: 36, weighingDate: daysAgo(90) },
            { weightKg: 40, weighingDate: daysAgo(5) },
          ],
        },
      },
    }),

    // Doe with recent abortion, average BCS → moderate
    prisma.animal.upsert({
      where: { id: 'animal-doe-002' },
      update: {},
      create: {
        id: 'animal-doe-002',
        identifier: 'CAP-002',
        species: 'goat',
        name: 'Flor',
        breed: 'Anglo-Nubian',
        sex: 'female',
        birthDate: new Date('2022-08-12'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 1,
        birthCount: 1,
        abortionCount: 1,
        lastBirthDate: daysAgo(65),
        bodyConditionScore: 3,
        farmId: farm.id,
        weighings: {
          create: [{ weightKg: 37, weighingDate: daysAgo(8) }],
        },
      },
    }),

    // Doe with reproductive disease + underweight → high risk
    prisma.animal.upsert({
      where: { id: 'animal-doe-003' },
      update: {},
      create: {
        id: 'animal-doe-003',
        identifier: 'CAP-003',
        species: 'goat',
        name: 'Rosa',
        breed: 'Canindé',
        sex: 'female',
        birthDate: new Date('2021-12-20'),
        reproductiveStatus: 'Ready',
        pregnancyHistory: 0,
        birthCount: 0,
        abortionCount: 1,
        bodyConditionScore: 2,
        reproductiveDiseaseHistory: true,
        farmId: farm.id,
        weighings: {
          create: [{ weightKg: 28, weighingDate: daysAgo(4) }],
        },
      },
    }),
  ]);

  // ─── Reproductive events ─────────────────────────────────────────────────────

  await Promise.all([
    // Mimosa — insemination with positive diagnosis
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-cow-001',
        breederId: 'breeder-nelore-001',
        eventType: 'artificial_insemination',
        inseminator: 'Dr. Carlos Veterinario',
        reproductiveProtocol: 'FTAI',
        eventDate: daysAgo(200),
        pregnancyDiagnosis: 'positive',
        confirmationDate: daysAgo(170),
        result: 'Pregnancy confirmed by ultrasound',
      },
    }),
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-cow-001',
        eventType: 'birth',
        eventDate: daysAgo(80),
        pregnancyDiagnosis: 'positive',
        result: 'Normal birth, healthy calf',
      },
    }),

    // Estrela — failed insemination + abortion
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-cow-002',
        breederId: 'breeder-gir-001',
        eventType: 'artificial_insemination',
        reproductiveProtocol: 'Ovsynch',
        eventDate: daysAgo(150),
        pregnancyDiagnosis: 'negative',
        confirmationDate: daysAgo(120),
      },
    }),
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-cow-002',
        breederId: 'breeder-angus-001',
        eventType: 'natural_mating',
        eventDate: daysAgo(100),
        pregnancyDiagnosis: 'positive',
      },
    }),
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-cow-002',
        eventType: 'abortion',
        eventDate: daysAgo(30),
        pregnancyDiagnosis: 'negative',
        result: 'Abortion at 60 days gestation — cause under investigation',
      },
    }),

    // Branca (ewe) — positive history
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-ewe-001',
        breederId: 'breeder-dorper-001',
        eventType: 'controlled_mating',
        eventDate: daysAgo(270),
        pregnancyDiagnosis: 'positive',
        confirmationDate: daysAgo(240),
      },
    }),
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-ewe-001',
        eventType: 'birth',
        eventDate: daysAgo(90),
        pregnancyDiagnosis: 'positive',
        result: 'Twin birth, two healthy lambs',
      },
    }),

    // Nuvem (doe) — recent history
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-doe-001',
        breederId: 'breeder-boer-001',
        eventType: 'natural_mating',
        eventDate: daysAgo(270),
        pregnancyDiagnosis: 'positive',
        confirmationDate: daysAgo(240),
      },
    }),
    prisma.reproductiveEvent.create({
      data: {
        animalId: 'animal-doe-001',
        eventType: 'birth',
        eventDate: daysAgo(75),
        pregnancyDiagnosis: 'positive',
        result: 'Normal birth, healthy kid',
      },
    }),
  ]);

  const totalAnimals = await prisma.animal.count({ where: { farmId: farm.id } });
  const totalBreeders = await prisma.breeder.count({ where: { farmId: farm.id } });

  console.log('\n Seed completed!');
  console.log(`   User    : demo@insemiai.com  |  password: 123456`);
  console.log(`   Farm    : ${farm.name} (${farm.id})`);
  console.log(`   Animals : ${totalAnimals}  |  Breeders: ${totalBreeders}`);
  console.log('\n   Profiles created:');
  console.log('   HIGH prob   — Mimosa (BOV-001), Branca (OVI-001), Nuvem (CAP-001)');
  console.log('   MODERATE    — Estrela (BOV-002), Aurora (BOV-004), Serena (OVI-002), Lua (OVI-003), Flor (CAP-002)');
  console.log('   HIGH risk   — Perola (BOV-003), Rosa (CAP-003)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
