import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Periodo = 'ultima_semana' | 'ultimo_mes' | 'ultimo_trimestre' | 'ultimo_ano' | 'todos';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async resumo(fazendaId: string, usuarioId: string, periodo: Periodo = 'ultimo_mes', tipoAnimal?: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const dataInicio = this.calcularDataInicio(periodo);
    const filtroData = dataInicio ? { gte: dataInicio } : undefined;
    const filtroEspecie = tipoAnimal ? { especie: tipoAnimal } : {};

    const [
      totalAnimais,
      totalAnimaisAnterior,
      garanhoeAtivos,
      garanhoeAtivosAnterior,
      inseminacoesSucesso,
      inseminacoesSucessoAnterior,
      inseminacoesInsucesso,
      inseminacoesInsucessoAnterior,
      distribuicaoPorEspecie,
    ] = await Promise.all([
      this.prisma.animal.count({ where: { fazendaId, ativo: true, ...filtroEspecie } }),
      this.prisma.animal.count({
        where: { fazendaId, ativo: true, ...filtroEspecie, ...(dataInicio ? { criadoEm: { lt: dataInicio } } : {}) },
      }),
      this.prisma.reprodutor.count({ where: { fazendaId, ativo: true, ...(tipoAnimal ? { especie: tipoAnimal } : {}) } }),
      this.prisma.reprodutor.count({
        where: { fazendaId, ativo: true, ...(tipoAnimal ? { especie: tipoAnimal } : {}), ...(dataInicio ? { criadoEm: { lt: dataInicio } } : {}) },
      }),
      this.prisma.eventoReprodutivo.count({
        where: {
          animal: { fazendaId, ...filtroEspecie },
          diagnosticoPrenhez: 'positivo',
          ...(filtroData ? { dataEvento: filtroData } : {}),
        },
      }),
      this.prisma.eventoReprodutivo.count({
        where: {
          animal: { fazendaId, ...filtroEspecie },
          diagnosticoPrenhez: 'positivo',
          ...(dataInicio ? { dataEvento: { lt: dataInicio } } : {}),
        },
      }),
      this.prisma.eventoReprodutivo.count({
        where: {
          animal: { fazendaId, ...filtroEspecie },
          diagnosticoPrenhez: { in: ['negativo', 'falha_concepcao'] },
          ...(filtroData ? { dataEvento: filtroData } : {}),
        },
      }),
      this.prisma.eventoReprodutivo.count({
        where: {
          animal: { fazendaId, ...filtroEspecie },
          diagnosticoPrenhez: { in: ['negativo', 'falha_concepcao'] },
          ...(dataInicio ? { dataEvento: { lt: dataInicio } } : {}),
        },
      }),
      this.prisma.animal.groupBy({
        by: ['especie'],
        where: { fazendaId, ativo: true },
        _count: true,
      }),
    ]);

    // Gráfico: eventos dos últimos 6 meses agrupados por mês
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const eventosGrafico = await this.prisma.eventoReprodutivo.findMany({
      where: {
        animal: { fazendaId, ...filtroEspecie },
        dataEvento: { gte: seisMesesAtras },
        tipoEvento: { in: ['inseminacao_artificial', 'monta_natural', 'monta_controlada'] },
      },
      select: { dataEvento: true, diagnosticoPrenhez: true },
      orderBy: { dataEvento: 'asc' },
    });

    const grafico = this.agruparPorMes(eventosGrafico);

    const totalAvaliados = inseminacoesSucesso + inseminacoesInsucesso;
    const taxaPrenhez = totalAvaliados > 0 ? Math.round((inseminacoesSucesso / totalAvaliados) * 100) : 0;

    const calcVariacao = (atual: number, anterior: number) =>
      anterior === 0 ? 0 : Math.round(((atual - anterior) / anterior) * 100);

    return {
      cards: {
        totalAnimais: { valor: totalAnimais, variacao: calcVariacao(totalAnimais, totalAnimaisAnterior) },
        garanhoeAtivos: { valor: garanhoeAtivos, variacao: calcVariacao(garanhoeAtivos, garanhoeAtivosAnterior) },
        inseminacoesSucesso: { valor: inseminacoesSucesso, variacao: calcVariacao(inseminacoesSucesso, inseminacoesSucessoAnterior) },
        inseminacoesInsucesso: { valor: inseminacoesInsucesso, variacao: calcVariacao(inseminacoesInsucesso, inseminacoesInsucessoAnterior) },
        taxaPrenhez,
      },
      grafico,
      distribuicaoPorEspecie: distribuicaoPorEspecie.map((e) => ({ especie: e.especie, quantidade: e._count })),
    };
  }

  private agruparPorMes(eventos: { dataEvento: Date; diagnosticoPrenhez: string }[]) {
    const mapa = new Map<string, { mes: string; total: number; sucesso: number }>();

    for (const e of eventos) {
      const mes = `${e.dataEvento.getFullYear()}-${String(e.dataEvento.getMonth() + 1).padStart(2, '0')}`;
      if (!mapa.has(mes)) mapa.set(mes, { mes, total: 0, sucesso: 0 });
      const entry = mapa.get(mes)!;
      entry.total += 1;
      if (e.diagnosticoPrenhez === 'positivo') entry.sucesso += 1;
    }

    return Array.from(mapa.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }

  private calcularDataInicio(periodo: Periodo): Date | null {
    const dias: Record<string, number> = {
      ultima_semana: 7,
      ultimo_mes: 30,
      ultimo_trimestre: 90,
      ultimo_ano: 365,
    };
    const d = dias[periodo];
    if (!d) return null;
    return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  }
}
