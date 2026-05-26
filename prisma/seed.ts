import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const dias = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const senhaHash = await bcrypt.hash('123456', 10);

  const usuario = await prisma.usuario.upsert({
    where: { email: 'demo@pecuaria.ia' },
    update: {},
    create: { nome: 'Produtor Demo', email: 'demo@pecuaria.ia', senha: senhaHash },
  });

  const fazenda = await prisma.fazenda.upsert({
    where: { id: 'fazenda-demo-001' },
    update: {},
    create: {
      id: 'fazenda-demo-001',
      nome: 'Fazenda São João',
      municipio: 'Crateús',
      estado: 'CE',
      taxaMediaPrenhez: 68,
      usuarioId: usuario.id,
    },
  });

  // ─── Reprodutores ────────────────────────────────────────────────────────────

  await Promise.all([
    prisma.reprodutor.upsert({
      where: { id: 'repr-nelore-001' },
      update: {},
      create: {
        id: 'repr-nelore-001',
        nome: 'Imperador',
        especie: 'bovino',
        raca: 'Nelore',
        scoreFertilidade: 85,
        scoreEstimado: 85,
        totalInseminacoes: 0,
        prenhezes: 0,
        fazendaId: fazenda.id,
      },
    }),
    prisma.reprodutor.upsert({
      where: { id: 'repr-angus-001' },
      update: {},
      create: {
        id: 'repr-angus-001',
        nome: 'Black Diamond',
        especie: 'bovino',
        raca: 'Angus',
        scoreFertilidade: 82,
        scoreEstimado: 82,
        totalInseminacoes: 12,
        prenhezes: 9,
        fazendaId: fazenda.id,
      },
    }),
    prisma.reprodutor.upsert({
      where: { id: 'repr-gir-001' },
      update: {},
      create: {
        id: 'repr-gir-001',
        nome: 'Rajado do Sertão',
        especie: 'bovino',
        raca: 'Gir',
        scoreFertilidade: 58,
        scoreEstimado: 78,
        totalInseminacoes: 8,
        prenhezes: 3,
        fazendaId: fazenda.id,
      },
    }),
    prisma.reprodutor.upsert({
      where: { id: 'repr-santa-001' },
      update: {},
      create: {
        id: 'repr-santa-001',
        nome: 'Zeus',
        especie: 'bovino',
        raca: 'Santa Gertrudis',
        scoreFertilidade: 78,
        scoreEstimado: 78,
        totalInseminacoes: 0,
        prenhezes: 0,
        fazendaId: fazenda.id,
      },
    }),
    prisma.reprodutor.upsert({
      where: { id: 'repr-dorper-001' },
      update: {},
      create: {
        id: 'repr-dorper-001',
        nome: 'Campeão Dorper',
        especie: 'ovino',
        raca: 'Dorper',
        scoreFertilidade: 88,
        scoreEstimado: 88,
        totalInseminacoes: 15,
        prenhezes: 13,
        fazendaId: fazenda.id,
      },
    }),
    prisma.reprodutor.upsert({
      where: { id: 'repr-santaines-001' },
      update: {},
      create: {
        id: 'repr-santaines-001',
        nome: 'Nordestino',
        especie: 'ovino',
        raca: 'Santa Inês',
        scoreFertilidade: 85,
        scoreEstimado: 85,
        totalInseminacoes: 10,
        prenhezes: 8,
        fazendaId: fazenda.id,
      },
    }),
    prisma.reprodutor.upsert({
      where: { id: 'repr-boer-001' },
      update: {},
      create: {
        id: 'repr-boer-001',
        nome: 'Rei Boer',
        especie: 'caprino',
        raca: 'Boer',
        scoreFertilidade: 85,
        scoreEstimado: 85,
        totalInseminacoes: 20,
        prenhezes: 16,
        fazendaId: fazenda.id,
      },
    }),
    prisma.reprodutor.upsert({
      where: { id: 'repr-anglonubiana-001' },
      update: {},
      create: {
        id: 'repr-anglonubiana-001',
        nome: 'Sultão',
        especie: 'caprino',
        raca: 'Anglonubiana',
        scoreFertilidade: 72,
        scoreEstimado: 79,
        totalInseminacoes: 6,
        prenhezes: 3,
        fazendaId: fazenda.id,
      },
    }),
  ]);

  // ─── Animais ─────────────────────────────────────────────────────────────────

  await Promise.all([

    // BOVINOS ──────────────────────────────────────────────────────────────────

    // Perfil ideal: peso ótimo, pós-parto ok, histórico limpo → alta probabilidade
    prisma.animal.upsert({
      where: { id: 'animal-vaca-001' },
      update: {},
      create: {
        id: 'animal-vaca-001',
        identificador: 'BOV-001',
        especie: 'bovino',
        nome: 'Mimosa',
        raca: 'Nelore',
        sexo: 'femea',
        dataNascimento: new Date('2021-03-15'),
        statusReproducao: 'Apto',
        historicoPrenhez: 2,
        quantidadePartos: 2,
        quantidadeAbortos: 0,
        dataUltimoParto: dias(80),
        scoreCondicaoCorporal: 4,
        fazendaId: fazenda.id,
        pesagens: {
          create: [
            { pesoKg: 410, dataPesagem: dias(180) },
            { pesoKg: 430, dataPesagem: dias(90) },
            { pesoKg: 445, dataPesagem: dias(5) },
          ],
        },
      },
    }),

    // Perfil de risco: pós-parto curto + histórico de aborto → probabilidade moderada
    prisma.animal.upsert({
      where: { id: 'animal-vaca-002' },
      update: {},
      create: {
        id: 'animal-vaca-002',
        identificador: 'BOV-002',
        especie: 'bovino',
        nome: 'Estrela',
        raca: 'Girolando',
        sexo: 'femea',
        dataNascimento: new Date('2022-07-20'),
        statusReproducao: 'Apto',
        historicoPrenhez: 1,
        quantidadePartos: 1,
        quantidadeAbortos: 1,
        dataUltimoParto: dias(30),
        scoreCondicaoCorporal: 3,
        historicoDoencaReprodutiva: false,
        fazendaId: fazenda.id,
        pesagens: {
          create: [
            { pesoKg: 370, dataPesagem: dias(60) },
            { pesoKg: 390, dataPesagem: dias(10) },
          ],
        },
      },
    }),

    // Perfil crítico: ECC baixo + doença reprodutiva + peso abaixo + prenhe anterior com aborto
    prisma.animal.upsert({
      where: { id: 'animal-vaca-003' },
      update: {},
      create: {
        id: 'animal-vaca-003',
        identificador: 'BOV-003',
        especie: 'bovino',
        nome: 'Pérola',
        raca: 'Brahman',
        sexo: 'femea',
        dataNascimento: new Date('2020-11-02'),
        statusReproducao: 'Apto',
        historicoPrenhez: 1,
        quantidadePartos: 0,
        quantidadeAbortos: 2,
        dataUltimoParto: null,
        scoreCondicaoCorporal: 2,
        historicoDoencaReprodutiva: true,
        fazendaId: fazenda.id,
        pesagens: {
          create: [
            { pesoKg: 340, dataPesagem: dias(30) },
            { pesoKg: 355, dataPesagem: dias(5) },
          ],
        },
      },
    }),

    // Nulípara jovem: nunca pariu, boa condição, peso limítrofe → moderado
    prisma.animal.upsert({
      where: { id: 'animal-vaca-004' },
      update: {},
      create: {
        id: 'animal-vaca-004',
        identificador: 'BOV-004',
        especie: 'bovino',
        nome: 'Aurora',
        raca: 'Senepol',
        sexo: 'femea',
        dataNascimento: new Date('2023-05-18'),
        statusReproducao: 'Apto',
        historicoPrenhez: 0,
        quantidadePartos: 0,
        quantidadeAbortos: 0,
        scoreCondicaoCorporal: 3,
        fazendaId: fazenda.id,
        pesagens: {
          create: [{ pesoKg: 385, dataPesagem: dias(7) }],
        },
      },
    }),

    // OVINOS ───────────────────────────────────────────────────────────────────

    // Ovelha experiente, ótimo histórico → alta probabilidade
    prisma.animal.upsert({
      where: { id: 'animal-ovelha-001' },
      update: {},
      create: {
        id: 'animal-ovelha-001',
        identificador: 'OVI-001',
        especie: 'ovino',
        nome: 'Branca',
        raca: 'Dorper',
        sexo: 'femea',
        dataNascimento: new Date('2022-01-10'),
        statusReproducao: 'Apto',
        historicoPrenhez: 3,
        quantidadePartos: 3,
        quantidadeAbortos: 0,
        dataUltimoParto: dias(90),
        scoreCondicaoCorporal: 4,
        fazendaId: fazenda.id,
        pesagens: {
          create: [
            { pesoKg: 48, dataPesagem: dias(120) },
            { pesoKg: 52, dataPesagem: dias(10) },
          ],
        },
      },
    }),

    // Ovelha com ECC baixo e pós-parto curto → moderado/alto risco
    prisma.animal.upsert({
      where: { id: 'animal-ovelha-002' },
      update: {},
      create: {
        id: 'animal-ovelha-002',
        identificador: 'OVI-002',
        especie: 'ovino',
        nome: 'Serena',
        raca: 'Santa Inês',
        sexo: 'femea',
        dataNascimento: new Date('2022-09-14'),
        statusReproducao: 'Apto',
        historicoPrenhez: 1,
        quantidadePartos: 1,
        quantidadeAbortos: 0,
        dataUltimoParto: dias(40),
        scoreCondicaoCorporal: 2,
        fazendaId: fazenda.id,
        pesagens: {
          create: [{ pesoKg: 38, dataPesagem: dias(5) }],
        },
      },
    }),

    // Ovelha nulípara jovem, boa condição → moderado (sem histórico)
    prisma.animal.upsert({
      where: { id: 'animal-ovelha-003' },
      update: {},
      create: {
        id: 'animal-ovelha-003',
        identificador: 'OVI-003',
        especie: 'ovino',
        nome: 'Lua',
        raca: 'Morada Nova',
        sexo: 'femea',
        dataNascimento: new Date('2024-02-20'),
        statusReproducao: 'Apto',
        historicoPrenhez: 0,
        quantidadePartos: 0,
        quantidadeAbortos: 0,
        scoreCondicaoCorporal: 4,
        fazendaId: fazenda.id,
        pesagens: {
          create: [{ pesoKg: 47, dataPesagem: dias(3) }],
        },
      },
    }),

    // CAPRINOS ─────────────────────────────────────────────────────────────────

    // Cabra experiente, histórico excelente → alta probabilidade
    prisma.animal.upsert({
      where: { id: 'animal-cabra-001' },
      update: {},
      create: {
        id: 'animal-cabra-001',
        identificador: 'CAP-001',
        especie: 'caprino',
        nome: 'Nuvem',
        raca: 'Boer',
        sexo: 'femea',
        dataNascimento: new Date('2022-04-05'),
        statusReproducao: 'Apto',
        historicoPrenhez: 2,
        quantidadePartos: 2,
        quantidadeAbortos: 0,
        dataUltimoParto: dias(75),
        scoreCondicaoCorporal: 4,
        fazendaId: fazenda.id,
        pesagens: {
          create: [
            { pesoKg: 36, dataPesagem: dias(90) },
            { pesoKg: 40, dataPesagem: dias(5) },
          ],
        },
      },
    }),

    // Cabra com aborto recente, ECC médio → moderado
    prisma.animal.upsert({
      where: { id: 'animal-cabra-002' },
      update: {},
      create: {
        id: 'animal-cabra-002',
        identificador: 'CAP-002',
        especie: 'caprino',
        nome: 'Flor',
        raca: 'Anglonubiana',
        sexo: 'femea',
        dataNascimento: new Date('2022-08-12'),
        statusReproducao: 'Apto',
        historicoPrenhez: 1,
        quantidadePartos: 1,
        quantidadeAbortos: 1,
        dataUltimoParto: dias(65),
        scoreCondicaoCorporal: 3,
        fazendaId: fazenda.id,
        pesagens: {
          create: [{ pesoKg: 37, dataPesagem: dias(8) }],
        },
      },
    }),

    // Cabra com doença reprodutiva + peso baixo → alto risco
    prisma.animal.upsert({
      where: { id: 'animal-cabra-003' },
      update: {},
      create: {
        id: 'animal-cabra-003',
        identificador: 'CAP-003',
        especie: 'caprino',
        nome: 'Rosa',
        raca: 'Canindé',
        sexo: 'femea',
        dataNascimento: new Date('2021-12-20'),
        statusReproducao: 'Apto',
        historicoPrenhez: 0,
        quantidadePartos: 0,
        quantidadeAbortos: 1,
        scoreCondicaoCorporal: 2,
        historicoDoencaReprodutiva: true,
        fazendaId: fazenda.id,
        pesagens: {
          create: [{ pesoKg: 28, dataPesagem: dias(4) }],
        },
      },
    }),
  ]);

  // ─── Eventos reprodutivos históricos ─────────────────────────────────────────

  await Promise.all([
    // Mimosa — inseminação com diagnóstico positivo
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-vaca-001',
        reprodutorId: 'repr-nelore-001',
        tipoEvento: 'inseminacao_artificial',
        inseminador: 'Dr. Carlos Veterinário',
        protocoloReprodutivo: 'IATF',
        dataEvento: dias(200),
        diagnosticoPrenhez: 'positivo',
        dataConfirmacao: dias(170),
        resultado: 'Prenhez confirmada por ultrassom',
      },
    }),
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-vaca-001',
        tipoEvento: 'parto',
        dataEvento: dias(80),
        diagnosticoPrenhez: 'positivo',
        resultado: 'Parto normal, bezerra saudável',
      },
    }),

    // Estrela — inseminação com falha + aborto registrado
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-vaca-002',
        reprodutorId: 'repr-gir-001',
        tipoEvento: 'inseminacao_artificial',
        protocoloReprodutivo: 'Ovsynch',
        dataEvento: dias(150),
        diagnosticoPrenhez: 'negativo',
        dataConfirmacao: dias(120),
      },
    }),
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-vaca-002',
        reprodutorId: 'repr-angus-001',
        tipoEvento: 'monta_natural',
        dataEvento: dias(100),
        diagnosticoPrenhez: 'positivo',
      },
    }),
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-vaca-002',
        tipoEvento: 'aborto',
        dataEvento: dias(30),
        diagnosticoPrenhez: 'negativo',
        resultado: 'Aborto aos 60 dias de gestação — causa investigada',
      },
    }),

    // Branca (ovelha) — histórico positivo
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-ovelha-001',
        reprodutorId: 'repr-dorper-001',
        tipoEvento: 'monta_controlada',
        dataEvento: dias(270),
        diagnosticoPrenhez: 'positivo',
        dataConfirmacao: dias(240),
      },
    }),
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-ovelha-001',
        tipoEvento: 'parto',
        dataEvento: dias(90),
        diagnosticoPrenhez: 'positivo',
        resultado: 'Parto gemelar, dois cordeiros saudáveis',
      },
    }),

    // Nuvem (cabra) — histórico recente
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-cabra-001',
        reprodutorId: 'repr-boer-001',
        tipoEvento: 'monta_natural',
        dataEvento: dias(270),
        diagnosticoPrenhez: 'positivo',
        dataConfirmacao: dias(240),
      },
    }),
    prisma.eventoReprodutivo.create({
      data: {
        animalId: 'animal-cabra-001',
        tipoEvento: 'parto',
        dataEvento: dias(75),
        diagnosticoPrenhez: 'positivo',
        resultado: 'Parto normal, cabrito saudável',
      },
    }),
  ]);

  const totalAnimais = await prisma.animal.count({ where: { fazendaId: fazenda.id } });
  const totalReprodutores = await prisma.reprodutor.count({ where: { fazendaId: fazenda.id } });

  console.log('\n✅ Seed concluído!');
  console.log(`   Usuário : demo@pecuaria.ia  |  senha: 123456`);
  console.log(`   Fazenda : ${fazenda.nome} (${fazenda.id})`);
  console.log(`   Animais : ${totalAnimais}  |  Reprodutores: ${totalReprodutores}`);
  console.log('\n   Perfis criados:');
  console.log('   🟢 Alta prob  — Mimosa (BOV-001), Branca (OVI-001), Nuvem (CAP-001)');
  console.log('   🟡 Moderado   — Estrela (BOV-002), Aurora (BOV-004), Serena (OVI-002), Lua (OVI-003), Flor (CAP-002)');
  console.log('   🔴 Alto risco — Pérola (BOV-003), Rosa (CAP-003)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
