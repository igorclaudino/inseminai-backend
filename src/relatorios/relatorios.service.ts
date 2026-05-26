import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  async desempenhoFazenda(fazendaId: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const [totalAnimais, porEspecie, totalEventos, prenhezes, predicoes] = await Promise.all([
      this.prisma.animal.count({ where: { fazendaId, ativo: true } }),
      this.prisma.animal.groupBy({
        by: ['especie'],
        where: { fazendaId, ativo: true },
        _count: true,
      }),
      this.prisma.eventoReprodutivo.count({
        where: { animal: { fazendaId } },
      }),
      this.prisma.eventoReprodutivo.count({
        where: { animal: { fazendaId }, diagnosticoPrenhez: 'positivo' },
      }),
      this.prisma.predicao.findMany({
        where: { animal: { fazendaId } },
        select: { probabilidadePrenhez: true, nivelRisco: true, criadoEm: true },
        orderBy: { criadoEm: 'desc' },
        take: 30,
      }),
    ]);

    const taxaGeralPrenhez = totalEventos > 0 ? Math.round((prenhezes / totalEventos) * 100) : 0;
    const mediaProbabilidade =
      predicoes.length > 0
        ? Math.round(predicoes.reduce((acc, p) => acc + p.probabilidadePrenhez, 0) / predicoes.length)
        : 0;

    const distribuicaoRisco = predicoes.reduce(
      (acc, p) => {
        acc[p.nivelRisco] = (acc[p.nivelRisco] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      fazenda: { id: fazenda.id, nome: fazenda.nome },
      resumo: {
        totalAnimais,
        totalEventos,
        prenhezes,
        taxaGeralPrenhez,
        mediaProbabilidadeIA: mediaProbabilidade,
      },
      porEspecie: porEspecie.map((e) => ({ especie: e.especie, quantidade: e._count })),
      distribuicaoRisco,
    };
  }

  async desempenhoAnimal(animalId: string, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        fazenda: true,
        pesagens: { orderBy: { dataPesagem: 'desc' }, take: 1 },
      },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const [eventos, predicoes] = await Promise.all([
      this.prisma.eventoReprodutivo.findMany({
        where: { animalId },
        include: { reprodutor: true },
        orderBy: { dataEvento: 'desc' },
      }),
      this.prisma.predicao.findMany({
        where: { animalId },
        orderBy: { criadoEm: 'desc' },
      }),
    ]);

    const eventoComDiagnostico = eventos.filter((e) => e.diagnosticoPrenhez !== 'pendente');
    const taxaPrenhez =
      eventoComDiagnostico.length > 0
        ? Math.round(
            (eventoComDiagnostico.filter((e) => e.diagnosticoPrenhez === 'positivo').length /
              eventoComDiagnostico.length) *
              100,
          )
        : 0;

    const idadeMeses = animal.dataNascimento
      ? Math.floor(
          (Date.now() - new Date(animal.dataNascimento).getTime()) / (1000 * 60 * 60 * 24 * 30.44),
        )
      : null;
    const pesoKg = animal.pesagens[0]?.pesoKg ?? null;

    return {
      animal: {
        id: animal.id,
        nome: animal.nome,
        especie: animal.especie,
        raca: animal.raca,
        sexo: animal.sexo,
        idadeMeses,
        pesoKg,
      },
      historico: {
        totalEventos: eventos.length,
        prenhezes: animal.historicoPrenhez,
        abortos: animal.quantidadeAbortos,
        partos: animal.quantidadePartos,
        taxaPrenhez,
        intervaloMedioPartos: animal.intervaloMedioPartos,
      },
      desempenhoUltimas30Dias: predicoes.slice(0, 5).map((p) => ({
        data: p.criadoEm,
        probabilidade: p.probabilidadePrenhez,
        risco: p.nivelRisco,
      })),
      eventos: eventos.map((e) => ({
        id: e.id,
        data: e.dataEvento,
        tipo: e.tipoEvento,
        reprodutor: e.reprodutor?.nome || null,
        resultado: e.diagnosticoPrenhez,
        confirmacao: e.dataConfirmacao,
      })),
    };
  }

  async rankingReprodutores(fazendaId: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    return this.prisma.reprodutor.findMany({
      where: { fazendaId, ativo: true },
      orderBy: { scoreFertilidade: 'desc' },
      select: {
        id: true,
        nome: true,
        especie: true,
        raca: true,
        scoreFertilidade: true,
        totalInseminacoes: true,
        prenhezes: true,
      },
    });
  }
}
