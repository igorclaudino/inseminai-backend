import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { PreverPrenhezDto } from './dto/prever-prenhez.dto';
import { AtualizarPerfilIaDto } from './dto/atualizar-perfil-ia.dto';
import { MelhorMatrizDto } from './dto/melhor-matriz.dto';
import { RecomendarReprodutorDto } from './dto/recomendar-reprodutor.dto';
import { calcularDiasPosParto } from '../common/helpers/dias-pos-parto';
import { PERFIS_IA, PERFIS_VALIDOS, PerfilIaConfig } from './ia-perfil.constants';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface ItemFundamentacao {
  fator: string;
  valorObservado: string;
  pontuacao: string;
  referencia: string;
}

export interface ResultadoPredicao {
  probabilidadePrenhez: number;
  scoreFertilidade: number;
  nivelRisco: string;
  compatibilidadeGenetica: number | null;
  fatoresPositivos: string[];
  alertas: string[];
  recomendacoes: string[];
  fundamentacao: ItemFundamentacao[];
  formulaProbabilidade: string;
  insightGpt?: string;
  protocolo?: string;
  /** Metadados de consumo — informam ao frontend qual perfil foi usado e quantos tokens consumiu */
  _meta?: {
    perfilIa: string;
    perfilNome: string;
    tokensEntrada: number;
    tokensSaida: number;
    tokensTotal: number;
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class IaService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // ── Listagem estática de perfis ──────────────────────────────────────────

  listarPerfis() {
    return Object.values(PERFIS_IA).map((p) => ({
      id: p.id,
      nome: p.nome,
      icone: p.icone,
      resumo: p.resumo,
      descricao: p.descricao,
      melhorPara: p.melhorPara,
      latenciaEstimada: p.latenciaEstimada,
      tokensEstimadosPorAnalise: p.tokensEntradaEstimados + p.tokensSaidaEstimados,
      custoEstimadoPor1000Analises: {
        usd: p.custoUsdPor1000,
        brl: +(p.custoUsdPor1000 * 5.7).toFixed(2),
      },
    }));
  }

  // ── Config de IA por fazenda (tenant) ────────────────────────────────────

  async obterConfigIa(fazendaId: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const perfil = PERFIS_IA[fazenda.perfilIa] ?? PERFIS_IA.padrao;
    return {
      fazendaId: fazenda.id,
      fazendaNome: fazenda.nome,
      perfilAtual: {
        id: perfil.id,
        nome: perfil.nome,
        icone: perfil.icone,
        resumo: perfil.resumo,
        descricao: perfil.descricao,
      },
      perfisDisponiveis: this.listarPerfis(),
    };
  }

  async atualizarConfigIa(fazendaId: string, dto: AtualizarPerfilIaDto, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    if (!PERFIS_VALIDOS.includes(dto.perfilIa)) {
      throw new BadRequestException(`Perfil inválido. Valores aceitos: ${PERFIS_VALIDOS.join(', ')}`);
    }

    const atualizado = await this.prisma.fazenda.update({
      where: { id: fazendaId },
      data: { perfilIa: dto.perfilIa },
    });

    const perfil = PERFIS_IA[dto.perfilIa];
    return {
      mensagem: `Perfil atualizado para "${perfil.nome}" com sucesso.`,
      fazendaId: atualizado.id,
      perfilAtual: {
        id: perfil.id,
        nome: perfil.nome,
        icone: perfil.icone,
        resumo: perfil.resumo,
      },
    };
  }

  // ── Predição de prenhez ──────────────────────────────────────────────────

  async preverPrenhez(dto: PreverPrenhezDto, usuarioId: string): Promise<ResultadoPredicao> {
    // Buscar animal com fazenda (para verificar dono e ler o perfilIa do tenant)
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      include: {
        fazenda: true,
        pesagens: { orderBy: { dataPesagem: 'desc' }, take: 1 },
      },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    let reprodutor = null;
    if (dto.reprodutorId) {
      reprodutor = await this.prisma.reprodutor.findUnique({ where: { id: dto.reprodutorId } });
    }

    const pesoAtual = animal.pesagens[0]?.pesoKg ?? 0;
    const resultado = this.calcularScore(animal, pesoAtual, reprodutor, dto);

    // Perfil: override no request → senão, perfil configurado na fazenda → senão, padrão
    const perfilId = dto.perfilIaOverride ?? animal.fazenda.perfilIa ?? 'padrao';
    const perfil: PerfilIaConfig = PERFIS_IA[perfilId] ?? PERFIS_IA.padrao;

    // Gerar insight conforme perfil
    let tokensEntrada = 0;
    let tokensSaida = 0;

    if (!perfil.chamaIA) {
      // ── Modo Essencial: insight gerado localmente, sem API ──
      resultado.insightGpt = this.gerarInsightLocal(animal, pesoAtual, resultado);
    } else {
      // ── Modos Padrão / Especialista: chama OpenAI ──
      const { texto, tokens } = await this.gerarInsightOpenAI(
        animal,
        pesoAtual,
        resultado,
        reprodutor,
        dto,
        perfil,
      );
      resultado.insightGpt = texto;
      tokensEntrada = tokens.entrada;
      tokensSaida = tokens.saida;
    }

    // Adicionar metadados de consumo na resposta
    resultado._meta = {
      perfilIa: perfil.id,
      perfilNome: perfil.nome,
      tokensEntrada,
      tokensSaida,
      tokensTotal: tokensEntrada + tokensSaida,
    };

    // Persistir predição com rastreamento de tokens e perfil
    await this.prisma.predicao.create({
      data: {
        animalId: dto.animalId,
        probabilidadePrenhez: resultado.probabilidadePrenhez,
        scoreFertilidade: resultado.scoreFertilidade,
        nivelRisco: resultado.nivelRisco,
        compatibilidadeGenetica: resultado.compatibilidadeGenetica,
        fatoresPositivos: resultado.fatoresPositivos,
        alertas: resultado.alertas,
        recomendacoes: resultado.recomendacoes,
        insightGpt: resultado.insightGpt,
        protocolo: dto.protocolo,
        temperaturaAmbiente: dto.temperaturaAmbiente ?? null,
        estacaoAno: dto.estacaoAno ?? null,
        perfilIa: perfil.id,
        tokensEntrada,
        tokensSaida,
        ...(dto.reprodutorId && { reprodutorId: dto.reprodutorId }),
      },
    });

    return resultado;
  }

  // ── Relatório de consumo de tokens por fazenda ───────────────────────────

  async relatorioConsumo(fazendaId: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    // Buscar todas as predições da fazenda
    const predicoes = await this.prisma.predicao.findMany({
      where: { animal: { fazendaId } },
      select: {
        perfilIa: true,
        tokensEntrada: true,
        tokensSaida: true,
        criadoEm: true,
      },
    });

    const totalAnalises = predicoes.length;

    // Agregar por perfil
    const porPerfil: Record<string, { count: number; tokensEntrada: number; tokensSaida: number }> = {
      essencial:    { count: 0, tokensEntrada: 0, tokensSaida: 0 },
      resumido:     { count: 0, tokensEntrada: 0, tokensSaida: 0 },
      padrao:       { count: 0, tokensEntrada: 0, tokensSaida: 0 },
      especialista: { count: 0, tokensEntrada: 0, tokensSaida: 0 },
    };

    for (const p of predicoes) {
      const k = PERFIS_VALIDOS.includes(p.perfilIa) ? p.perfilIa : 'padrao';
      porPerfil[k].count++;
      porPerfil[k].tokensEntrada += p.tokensEntrada;
      porPerfil[k].tokensSaida += p.tokensSaida;
    }

    const totalTokensEntrada = predicoes.reduce((acc, p) => acc + p.tokensEntrada, 0);
    const totalTokensSaida = predicoes.reduce((acc, p) => acc + p.tokensSaida, 0);
    const totalTokens = totalTokensEntrada + totalTokensSaida;

    // Custo real acumulado em USD
    const custoRealUsd =
      totalTokensEntrada * 0.00000015 + totalTokensSaida * 0.0000006;

    // Comparativo: quanto custaria se tudo fosse "especialista"
    const custoHipoteticoEspecialistaUsd =
      totalAnalises * PERFIS_IA.especialista.tokensEntradaEstimados * 0.00000015 +
      totalAnalises * PERFIS_IA.especialista.tokensSaidaEstimados * 0.0000006;

    const economiaUsd = Math.max(0, custoHipoteticoEspecialistaUsd - custoRealUsd);

    // Detalhe por perfil com médias reais
    const detalhesPorPerfil = PERFIS_VALIDOS.map((id) => {
      const dados = porPerfil[id];
      const perfil = PERFIS_IA[id];
      const totalTk = dados.tokensEntrada + dados.tokensSaida;
      const mediaTokens = dados.count > 0 ? Math.round(totalTk / dados.count) : 0;
      const custoDados = dados.tokensEntrada * 0.00000015 + dados.tokensSaida * 0.0000006;

      return {
        perfilId: id,
        perfilNome: perfil.nome,
        icone: perfil.icone,
        resumo: perfil.resumo,
        totalAnalises: dados.count,
        percentualUso: totalAnalises > 0 ? +((dados.count / totalAnalises) * 100).toFixed(1) : 0,
        tokens: {
          mediaRealPorAnalise: mediaTokens,
          estimadoPorAnalise: perfil.tokensEntradaEstimados + perfil.tokensSaidaEstimados,
          totalConsumido: totalTk,
        },
        custo: {
          totalUsd: +custoDados.toFixed(6),
          totalBrl: +(custoDados * 5.7).toFixed(4),
          estimadoPor1000AnalisesBrl: +(perfil.custoUsdPor1000 * 5.7).toFixed(2),
        },
        latenciaEstimada: perfil.latenciaEstimada,
      };
    });

    // Projeções para planejamento
    const projecoes = PERFIS_VALIDOS.map((id) => {
      const perfil = PERFIS_IA[id];
      const custoPor1000Brl = +(perfil.custoUsdPor1000 * 5.7).toFixed(2);
      return {
        perfilId: id,
        perfilNome: perfil.nome,
        para100AnalisesBrl: +(perfil.custoUsdPor1000 * 5.7 * 0.1).toFixed(2),
        para1000AnalisesBrl: custoPor1000Brl,
        para10000AnalisesBrl: +(perfil.custoUsdPor1000 * 5.7 * 10).toFixed(2),
      };
    });

    return {
      fazenda: { id: fazenda.id, nome: fazenda.nome, perfilAtual: fazenda.perfilIa },
      resumo: {
        totalAnalises,
        totalTokensConsumidos: totalTokens,
        custoRealAcumulado: {
          usd: +custoRealUsd.toFixed(6),
          brl: +(custoRealUsd * 5.7).toFixed(4),
        },
        economiaVsEspecialistaTotal: {
          usd: +economiaUsd.toFixed(6),
          brl: +(economiaUsd * 5.7).toFixed(4),
          percentual:
            custoHipoteticoEspecialistaUsd > 0
              ? +((economiaUsd / custoHipoteticoEspecialistaUsd) * 100).toFixed(1)
              : 0,
        },
      },
      porPerfil: detalhesPorPerfil,
      projecoesCusto: projecoes,
      _nota:
        'Custo calculado com base em GPT-4o-mini (US$ 0,150/1M tokens entrada, US$ 0,600/1M tokens saída). ' +
        'Câmbio referência: R$ 5,70/USD. Valores aproximados para fins de planejamento.',
    };
  }

  // ─── Melhor Reprodutor ───────────────────────────────────────────────────

  async recomendarReprodutor(
    fazendaId: string,
    animalId: string,
    dto: RecomendarReprodutorDto,
    usuarioId: string,
  ) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda || fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: { pesagens: { orderBy: { dataPesagem: 'desc' }, take: 1 } },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.sexo !== 'femea') throw new BadRequestException('Análise de reprodutor só se aplica a fêmeas');

    const reprodutores = await this.prisma.reprodutor.findMany({
      where: { fazendaId, especie: animal.especie, ativo: true },
      orderBy: { scoreFertilidade: 'desc' },
    });
    if (!reprodutores.length) throw new NotFoundException('Nenhum reprodutor ativo encontrado para esta espécie');

    const pesoAtual = animal.pesagens[0]?.pesoKg ?? 0;

    // Calcular compatibilidade para cada reprodutor
    const ranking = reprodutores.map((r) => {
      let compatibilidade = r.scoreFertilidade;

      // Bônus genético por raças diferentes (diversidade)
      if (r.raca.toLowerCase() !== (animal as any).raca.toLowerCase()) compatibilidade = Math.min(100, compatibilidade + 5);

      // Bônus se tem histórico real de inseminações registradas no sistema
      if (r.totalInseminacoes >= 10) compatibilidade = Math.min(100, compatibilidade + 3);

      // Penalização leve se score < 60 (fertilidade abaixo do ideal)
      if (r.scoreFertilidade < 60) compatibilidade = Math.max(0, compatibilidade - 10);

      const classificacao =
        compatibilidade >= 85 ? 'Excelente' :
        compatibilidade >= 70 ? 'Muito Bom' :
        compatibilidade >= 55 ? 'Bom' : 'Regular';

      return { reprodutor: r, compatibilidade, classificacao };
    });

    // Ordenar por compatibilidade final
    ranking.sort((a, b) => b.compatibilidade - a.compatibilidade);
    const top = ranking.slice(0, 5);

    // Perfil: override → perfil da fazenda → padrão
    const perfilId = dto.perfilIaOverride ?? fazenda.perfilIa ?? 'padrao';
    const perfil: PerfilIaConfig = PERFIS_IA[perfilId] ?? PERFIS_IA.padrao;

    let insightGpt = '';
    let tokensEntrada = 0;
    let tokensSaida = 0;

    if (!perfil.chamaIA) {
      // Essencial: insight local
      const melhor = top[0];
      insightGpt =
        `Reprodutor recomendado: ${melhor.reprodutor.nome} (${melhor.reprodutor.raca}, ` +
        `compatibilidade ${melhor.compatibilidade}/100). ` +
        `${top.length > 1 ? `Alternativa: ${top[1].reprodutor.nome} (${top[1].compatibilidade}/100).` : ''}`;
    } else {
      const { texto, tokens } = await this.gerarInsightReprodutorOpenAI(animal, pesoAtual, top, perfil);
      insightGpt = texto;
      tokensEntrada = tokens.entrada;
      tokensSaida = tokens.saida;
    }

    // Persistir no histórico (usando o top-1 como reprodutor principal)
    await this.prisma.predicao.create({
      data: {
        animalId,
        reprodutorId: top[0].reprodutor.id,
        tipoAnalise: 'melhor_reprodutor',
        probabilidadePrenhez: top[0].compatibilidade,
        scoreFertilidade: top[0].reprodutor.scoreFertilidade,
        nivelRisco: top[0].compatibilidade >= 70 ? 'baixo' : top[0].compatibilidade >= 50 ? 'moderado' : 'alto',
        compatibilidadeGenetica: top[0].compatibilidade,
        fatoresPositivos: top.slice(0, 3).map((r) => `${r.reprodutor.nome} (${r.classificacao}, score ${r.compatibilidade})`),
        alertas: top.filter((r) => r.reprodutor.scoreFertilidade < 60).map((r) => `${r.reprodutor.nome} com fertilidade abaixo do ideal`),
        recomendacoes: top.map((r, i) => `${i + 1}º ${r.reprodutor.nome} — ${r.reprodutor.raca} | compatibilidade ${r.compatibilidade}/100 | ${r.classificacao}`),
        insightGpt,
        perfilIa: perfil.id,
        tokensEntrada,
        tokensSaida,
      },
    });

    return {
      animal: {
        id: animal.id,
        nome: (animal as any).nome,
        especie: animal.especie,
        raca: (animal as any).raca,
        pesoAtual,
        scoreCondicaoCorporal: animal.scoreCondicaoCorporal,
      },
      ranking: top.map((item, i) => ({
        posicao: i + 1,
        reprodutor: {
          id: item.reprodutor.id,
          nome: item.reprodutor.nome,
          raca: item.reprodutor.raca,
          scoreFertilidade: item.reprodutor.scoreFertilidade,
          totalInseminacoes: item.reprodutor.totalInseminacoes,
          prenhezes: item.reprodutor.prenhezes,
          taxaRealPrenhez: item.reprodutor.totalInseminacoes > 0
            ? Math.round((item.reprodutor.prenhezes / item.reprodutor.totalInseminacoes) * 100)
            : null,
        },
        compatibilidade: item.compatibilidade,
        classificacao: item.classificacao,
        melhorEscolha: i === 0,
      })),
      insightGpt,
      _meta: {
        perfilIa: perfil.id,
        perfilNome: perfil.nome,
        tokensEntrada,
        tokensSaida,
        tokensTotal: tokensEntrada + tokensSaida,
      },
    };
  }

  // ─── Melhor Matriz ───────────────────────────────────────────────────────

  async melhorMatriz(fazendaId: string, dto: MelhorMatrizDto, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const limite = dto.limite ?? 5;

    // Buscar todas as fêmeas elegíveis
    const femeas = await this.prisma.animal.findMany({
      where: {
        fazendaId,
        sexo: 'femea',
        ativo: true,
        statusReproducao: { notIn: ['Prenhe', 'Inativo', 'Descarte'] },
        ...(dto.especie && { especie: dto.especie }),
      },
      include: {
        fazenda: true,
        pesagens: { orderBy: { dataPesagem: 'desc' }, take: 1 },
      },
    });

    if (!femeas.length) throw new NotFoundException('Nenhuma fêmea elegível encontrada para os filtros informados');

    // Parâmetros ambientais simulados para o scoring (sem reprodutor específico)
    const dtoScore: any = {
      protocolo: dto.protocolo ?? 'IATF',
      temperaturaAmbiente: dto.temperaturaAmbiente,
      estacaoAno: dto.estacaoAno,
    };

    // Calcular score para cada fêmea
    const pontuadas = femeas.map((animal) => {
      const pesoAtual = animal.pesagens[0]?.pesoKg ?? 0;
      const resultado = this.calcularScore(animal, pesoAtual, null, dtoScore);
      return { animal, pesoAtual, resultado };
    });

    // Ordenar por probabilidade de prenhez (maior primeiro)
    pontuadas.sort((a, b) => b.resultado.probabilidadePrenhez - a.resultado.probabilidadePrenhez);

    const topAnimais = pontuadas.slice(0, limite);

    // Perfil: override → perfil da fazenda → padrão
    const perfilId = dto.perfilIaOverride ?? fazenda.perfilIa ?? 'padrao';
    const perfil: PerfilIaConfig = PERFIS_IA[perfilId] ?? PERFIS_IA.padrao;

    let insightGpt = '';
    let tokensEntrada = 0;
    let tokensSaida = 0;

    if (!perfil.chamaIA) {
      // Essencial: insight local com top-3
      const top3 = topAnimais.slice(0, 3);
      insightGpt =
        `Melhores matrizes para inseminação agora: ` +
        top3.map((p, i) => `${i + 1}º ${(p.animal as any).nome} (${p.resultado.probabilidadePrenhez}%, risco ${p.resultado.nivelRisco})`).join('; ') + '.';
    } else {
      const { texto, tokens } = await this.gerarInsightMatrizOpenAI(topAnimais, fazenda, dto, perfil);
      insightGpt = texto;
      tokensEntrada = tokens.entrada;
      tokensSaida = tokens.saida;
    }

    // Persistir no histórico usando a top-1 fêmea como referência
    const topAnimal = topAnimais[0];
    await this.prisma.predicao.create({
      data: {
        animalId: topAnimal.animal.id,
        tipoAnalise: 'melhor_matriz',
        probabilidadePrenhez: topAnimal.resultado.probabilidadePrenhez,
        scoreFertilidade: topAnimal.resultado.scoreFertilidade,
        nivelRisco: topAnimal.resultado.nivelRisco,
        compatibilidadeGenetica: null,
        fatoresPositivos: topAnimal.resultado.fatoresPositivos.slice(0, 3),
        alertas: topAnimal.resultado.alertas.slice(0, 3),
        recomendacoes: topAnimais.map(
          (p, i) => `${i + 1}º ${(p.animal as any).nome} (${p.animal.especie} ${(p.animal as any).raca}) — ${p.resultado.probabilidadePrenhez}% | risco ${p.resultado.nivelRisco}`,
        ),
        insightGpt,
        protocolo: dto.protocolo,
        temperaturaAmbiente: dto.temperaturaAmbiente ?? null,
        estacaoAno: dto.estacaoAno ?? null,
        perfilIa: perfil.id,
        tokensEntrada,
        tokensSaida,
      },
    });

    return {
      fazenda: { id: fazenda.id, nome: fazenda.nome },
      parametros: {
        protocolo: dto.protocolo ?? 'IATF',
        temperaturaAmbiente: dto.temperaturaAmbiente ?? null,
        estacaoAno: dto.estacaoAno ?? null,
        especie: dto.especie ?? 'todas',
      },
      totalAnimaisAvaliados: femeas.length,
      ranking: topAnimais.map((p, i) => ({
        posicao: i + 1,
        animal: {
          id: p.animal.id,
          nome: (p.animal as any).nome,
          identificador: (p.animal as any).identificador,
          especie: p.animal.especie,
          raca: (p.animal as any).raca,
          statusReproducao: p.animal.statusReproducao,
          scoreCondicaoCorporal: p.animal.scoreCondicaoCorporal,
        },
        pesoAtual: p.pesoAtual,
        probabilidadePrenhez: p.resultado.probabilidadePrenhez,
        scoreFertilidade: p.resultado.scoreFertilidade,
        nivelRisco: p.resultado.nivelRisco,
        fatoresPositivos: p.resultado.fatoresPositivos,
        alertas: p.resultado.alertas,
        melhorEscolha: i === 0,
      })),
      insightGpt,
      _meta: {
        perfilIa: perfil.id,
        perfilNome: perfil.nome,
        tokensEntrada,
        tokensSaida,
        tokensTotal: tokensEntrada + tokensSaida,
      },
    };
  }

  async historicoPredicoes(animalId: string, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: { fazenda: true },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    return this.prisma.predicao.findMany({
      where: { animalId },
      orderBy: { criadoEm: 'desc' },
      include: {
        reprodutor: { select: { id: true, nome: true, raca: true, scoreFertilidade: true } },
      },
    });
  }

  async historicoFazenda(fazendaId: string, usuarioId: string, page = 1, limit = 20) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const where = { animal: { fazendaId } };

    const [predicoes, total] = await Promise.all([
      this.prisma.predicao.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          animal: { select: { id: true, nome: true, identificador: true, especie: true, raca: true } },
          reprodutor: { select: { id: true, nome: true, raca: true, scoreFertilidade: true } },
        },
      }),
      this.prisma.predicao.count({ where }),
    ]);

    return { data: predicoes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Métodos privados ─────────────────────────────────────────────────────

  /**
   * Modo Essencial: gera um insight curto e prático a partir dos dados já calculados,
   * sem nenhuma chamada a API externa. Latência próxima de zero.
   */
  private gerarInsightLocal(animal: any, pesoAtual: number, resultado: ResultadoPredicao): string {
    const partes: string[] = [];

    partes.push(`Probabilidade de prenhez: ${resultado.probabilidadePrenhez}% — risco ${resultado.nivelRisco}.`);

    if (resultado.fatoresPositivos.length > 0) {
      partes.push(`Destaque positivo: ${resultado.fatoresPositivos[0].toLowerCase()}.`);
    }

    if (resultado.alertas.length > 0) {
      partes.push(`Atenção: ${resultado.alertas[0].toLowerCase()}.`);
    } else {
      partes.push('Nenhum alerta identificado nos fatores avaliados.');
    }

    partes.push(resultado.recomendacoes[0] ?? 'Monitorar prenhez em 30 dias.');

    return partes.join(' ');
  }

  /**
   * Modos Padrão e Especialista: chama a OpenAI com prompts otimizados por perfil.
   * Retorna o texto gerado e os tokens reais consumidos.
   */
  private async gerarInsightOpenAI(
    animal: any,
    pesoAtual: number,
    resultado: ResultadoPredicao,
    reprodutor: any,
    dto: PreverPrenhezDto,
    perfil: PerfilIaConfig,
  ): Promise<{ texto: string; tokens: { entrada: number; saida: number } }> {
    if (!process.env.OPENAI_API_KEY) {
      return { texto: this.gerarInsightLocal(animal, pesoAtual, resultado), tokens: { entrada: 0, saida: 0 } };
    }

    const prompt =
      perfil.id === 'especialista'
        ? this.montarPromptEspecialista(animal, pesoAtual, resultado, reprodutor, dto)
        : perfil.id === 'resumido'
          ? this.montarPromptResumido(animal, pesoAtual, resultado)
          : this.montarPromptPadrao(animal, pesoAtual, resultado, reprodutor, dto);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: perfil.maxTokensSaida,
        temperature: perfil.temperature,
      });

      const texto = response.choices[0]?.message?.content?.trim() ?? '';
      const entrada = response.usage?.prompt_tokens ?? 0;
      const saida = response.usage?.completion_tokens ?? 0;

      return { texto, tokens: { entrada, saida } };
    } catch (err) {
      console.error('[IA] Erro ao chamar OpenAI:', err instanceof Error ? err.message : err);
      // Fallback para insight local em caso de falha
      return { texto: this.gerarInsightLocal(animal, pesoAtual, resultado), tokens: { entrada: 0, saida: 0 } };
    }
  }

  // ─── Prompts OpenAI: Melhor Reprodutor ───────────────────────────────────

  private async gerarInsightReprodutorOpenAI(
    animal: any,
    pesoAtual: number,
    ranking: Array<{ reprodutor: any; compatibilidade: number; classificacao: string }>,
    perfil: PerfilIaConfig,
  ): Promise<{ texto: string; tokens: { entrada: number; saida: number } }> {
    if (!process.env.OPENAI_API_KEY) {
      const melhor = ranking[0];
      return {
        texto: `Reprodutor recomendado: ${melhor.reprodutor.nome} (${melhor.reprodutor.raca}, compatibilidade ${melhor.compatibilidade}/100).`,
        tokens: { entrada: 0, saida: 0 },
      };
    }

    let prompt: string;

    if (perfil.id === 'especialista') {
      const top3 = ranking.slice(0, 3);
      prompt =
        `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
        `Fêmea para inseminação: ${animal.especie} ${animal.raca}, ${pesoAtual}kg, ECC ${animal.scoreCondicaoCorporal}/5, ` +
        `${animal.historicoPrenhez} prenhezes anteriores, ${animal.quantidadeAbortos} aborto(s).\n\n` +
        `Reprodutores disponíveis (por compatibilidade):\n` +
        top3.map((r, i) =>
          `${i + 1}. ${r.reprodutor.nome} — ${r.reprodutor.raca} | Score fertilidade: ${r.reprodutor.scoreFertilidade}/100 | ` +
          `Compatibilidade calculada: ${r.compatibilidade}/100 | ` +
          `Histórico: ${r.reprodutor.prenhezes} prenhezes em ${r.reprodutor.totalInseminacoes} inseminações | ${r.classificacao}`
        ).join('\n') + '\n\n' +
        `Em 3-4 frases técnicas: (1) justifique a recomendação do 1º colocado, (2) compare com a alternativa, ` +
        `(3) mencione critérios genéticos e de adaptação ao semiárido nordestino.`;
    } else if (perfil.id === 'resumido') {
      const top2 = ranking.slice(0, 2);
      prompt =
        `${animal.especie} ${animal.raca} fêmea. Reprodutores: ` +
        top2.map((r) => `${r.reprodutor.nome} (${r.reprodutor.raca}, compatibilidade ${r.compatibilidade}/100)`).join(', ') +
        `. 1 frase direta recomendando o melhor.`;
    } else {
      // padrao
      const top3 = ranking.slice(0, 3);
      prompt =
        `Técnico rural, sertão nordestino. Fêmea ${animal.especie} ${animal.raca}, ${pesoAtual}kg. ` +
        `Reprodutores rankeados: ${top3.map((r) => `${r.reprodutor.nome} ${r.reprodutor.raca} (compatibilidade ${r.compatibilidade}/100)`).join(', ')}. ` +
        `Recomende o melhor em 1-2 frases práticas.`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: perfil.maxTokensSaida,
        temperature: perfil.temperature,
      });
      const texto = response.choices[0]?.message?.content?.trim() ?? '';
      return { texto, tokens: { entrada: response.usage?.prompt_tokens ?? 0, saida: response.usage?.completion_tokens ?? 0 } };
    } catch (err) {
      console.error('[IA] Erro reprodutor OpenAI:', err instanceof Error ? err.message : err);
      return { texto: `Recomendação: ${ranking[0].reprodutor.nome} (compatibilidade ${ranking[0].compatibilidade}/100).`, tokens: { entrada: 0, saida: 0 } };
    }
  }

  // ─── Prompts OpenAI: Melhor Matriz ───────────────────────────────────────

  private async gerarInsightMatrizOpenAI(
    topAnimais: Array<{ animal: any; pesoAtual: number; resultado: any }>,
    fazenda: any,
    dto: MelhorMatrizDto,
    perfil: PerfilIaConfig,
  ): Promise<{ texto: string; tokens: { entrada: number; saida: number } }> {
    if (!process.env.OPENAI_API_KEY) {
      const top3 = topAnimais.slice(0, 3);
      return {
        texto: `Top ${top3.length} matrizes: ` + top3.map((p, i) => `${i + 1}º ${p.animal.nome} (${p.resultado.probabilidadePrenhez}%)`).join('; ') + '.',
        tokens: { entrada: 0, saida: 0 },
      };
    }

    let prompt: string;
    const top3 = topAnimais.slice(0, Math.min(3, topAnimais.length));

    if (perfil.id === 'especialista') {
      prompt =
        `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
        `Análise de rebanho — Fazenda ${fazenda.nome}` +
        `${dto.especie ? ` | Espécie: ${dto.especie}` : ''}` +
        `${dto.protocolo ? ` | Protocolo: ${dto.protocolo}` : ''}` +
        `${dto.temperaturaAmbiente ? ` | Temperatura: ${dto.temperaturaAmbiente}°C` : ''}` +
        `${dto.estacaoAno ? ` | Estação: ${dto.estacaoAno}` : ''}\n\n` +
        `Top ${top3.length} matrizes para inseminação agora:\n` +
        top3.map((p, i) =>
          `${i + 1}. ${p.animal.nome} — ${p.animal.especie} ${p.animal.raca} | ${p.pesoAtual}kg | ECC ${p.animal.scoreCondicaoCorporal}/5 | ` +
          `${p.animal.historicoPrenhez} prenhezes | ${p.animal.quantidadeAbortos} abortos | ` +
          `Status: ${p.animal.statusReproducao} | Probabilidade: ${p.resultado.probabilidadePrenhez}% | Risco: ${p.resultado.nivelRisco}`
        ).join('\n') + '\n\n' +
        `Em 3-4 frases técnicas: (1) por que essas fêmeas são as melhores candidatas agora, ` +
        `(2) padrões comuns de condição entre elas, (3) recomendações de prioridade e manejo para o técnico no semiárido.`;
    } else if (perfil.id === 'resumido') {
      prompt =
        `Rebanho semiárido. Top 3 fêmeas para inseminação: ` +
        top3.map((p) => `${p.animal.nome} (${p.animal.especie}, ${p.resultado.probabilidadePrenhez}%)`).join(', ') +
        `. 1 frase de orientação prática.`;
    } else {
      // padrao
      prompt =
        `Técnico rural, sertão nordestino. Melhores fêmeas para inseminar agora: ` +
        top3.map((p) => `${p.animal.nome} ${p.animal.especie} ${p.animal.raca} (${p.resultado.probabilidadePrenhez}%, risco ${p.resultado.nivelRisco})`).join('; ') +
        `. Principais alertas: ${topAnimais.flatMap((p) => p.resultado.alertas).slice(0, 3).join('; ') || 'nenhum'}. ` +
        `Oriente em 1-2 frases o técnico sobre prioridade e cuidados.`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: perfil.maxTokensSaida,
        temperature: perfil.temperature,
      });
      const texto = response.choices[0]?.message?.content?.trim() ?? '';
      return { texto, tokens: { entrada: response.usage?.prompt_tokens ?? 0, saida: response.usage?.completion_tokens ?? 0 } };
    } catch (err) {
      console.error('[IA] Erro matriz OpenAI:', err instanceof Error ? err.message : err);
      return { texto: `Top matriz: ${topAnimais[0].animal.nome} (${topAnimais[0].resultado.probabilidadePrenhez}% de prenhez).`, tokens: { entrada: 0, saida: 0 } };
    }
  }

  /**
   * Prompt ultra-compacto para o modo Resumido.
   * Mínimo de contexto (~30 tokens) → uma única frase conclusiva.
   */
  private montarPromptResumido(
    animal: any,
    pesoAtual: number,
    resultado: ResultadoPredicao,
  ): string {
    const alerta = resultado.alertas.length ? resultado.alertas[0] : null;
    return (
      `${animal.especie} ${animal.raca}, ${pesoAtual}kg. ` +
      `Prenhez: ${resultado.probabilidadePrenhez}%, risco ${resultado.nivelRisco}. ` +
      `${alerta ? `Alerta: ${alerta}.` : 'Sem alertas.'} ` +
      `1 frase prática e direta para o produtor.`
    );
  }

  /**
   * Prompt otimizado para o modo Padrão.
   * Compacto (~45 tokens) → respostas de 1-2 frases objetivas.
   */
  private montarPromptPadrao(
    animal: any,
    pesoAtual: number,
    resultado: ResultadoPredicao,
    reprodutor: any,
    dto: PreverPrenhezDto,
  ): string {
    const alertasTexto = resultado.alertas.length ? resultado.alertas.join('; ') : 'nenhum';
    const reprodutorTexto = reprodutor ? `${reprodutor.nome} (score ${reprodutor.scoreFertilidade}/100)` : 'não informado';

    return (
      `Técnico rural, sertão nordestino. ` +
      `${animal.especie} ${animal.raca}, ${pesoAtual}kg, ${animal.historicoPrenhez} prenhezes anteriores, ` +
      `${animal.quantidadeAbortos} aborto(s), protocolo: ${dto.protocolo ?? 'não informado'}, ` +
      `reprodutor: ${reprodutorTexto}. ` +
      `Resultado: ${resultado.probabilidadePrenhez}% de prenhez, risco ${resultado.nivelRisco}. ` +
      `Alertas: ${alertasTexto}. ` +
      `Escreva 1-2 frases práticas e diretas.`
    );
  }

  /**
   * Prompt detalhado para o modo Especialista.
   * Contextualizado (~120 tokens) → laudo de 3-4 frases técnicas com foco no semiárido.
   */
  private montarPromptEspecialista(
    animal: any,
    pesoAtual: number,
    resultado: ResultadoPredicao,
    reprodutor: any,
    dto: PreverPrenhezDto,
  ): string {
    const diasPosParto = calcularDiasPosParto(animal.dataUltimoParto);
    const reprodutorTexto = reprodutor
      ? `${reprodutor.nome}, raça ${reprodutor.raca}, score ${reprodutor.scoreFertilidade}/100 (${reprodutor.prenhezes} prenhezes em ${reprodutor.totalInseminacoes} inseminações)`
      : 'não informado';
    const tempTexto = dto.temperaturaAmbiente ? `${dto.temperaturaAmbiente}°C` : 'não informada';
    const estacaoTexto = dto.estacaoAno ?? 'não informada';
    const fatoresTexto = resultado.fatoresPositivos.join('; ') || 'nenhum';
    const alertasTexto = resultado.alertas.join('; ') || 'nenhum';

    return (
      `Você é veterinário especialista em reprodução animal no semiárido nordestino brasileiro.\n\n` +
      `Caso para análise:\n` +
      `• Animal: ${animal.especie} ${animal.raca} | Peso: ${pesoAtual} kg | ECC: ${animal.scoreCondicaoCorporal}/5\n` +
      `• Histórico: ${animal.historicoPrenhez} prenhezes, ${animal.quantidadeAbortos} aborto(s)` +
      `${animal.historicoDoencaReprodutiva ? ', com histórico de doença reprodutiva' : ''}\n` +
      `• Pós-parto: ${diasPosParto > 0 ? diasPosParto + ' dias' : 'sem parto anterior registrado'}\n` +
      `• Protocolo: ${dto.protocolo ?? 'não informado'} | Reprodutor: ${reprodutorTexto}\n` +
      `• Condições: Temperatura ${tempTexto} | Estação: ${estacaoTexto}\n\n` +
      `Resultado do modelo de scoring:\n` +
      `• Probabilidade de prenhez: ${resultado.probabilidadePrenhez}% | Risco: ${resultado.nivelRisco}\n` +
      `• Score zootécnico: ${resultado.scoreFertilidade}/100\n` +
      `• Fatores favoráveis: ${fatoresTexto}\n` +
      `• Alertas: ${alertasTexto}\n\n` +
      `Elabore um laudo técnico em 3-4 frases abordando: ` +
      `(1) avaliação geral do animal, ` +
      `(2) principais riscos ou pontos favoráveis para a inseminação, ` +
      `(3) recomendações práticas de manejo específicas para o semiárido nordestino. ` +
      `Linguagem técnica mas acessível ao produtor rural.`
    );
  }

  // ─── Score zootécnico (sem alterações funcionais) ─────────────────────────

  private calcularScore(animal: any, pesoAtual: number, reprodutor: any, dto: PreverPrenhezDto): ResultadoPredicao {
    let score = 0;
    const fatoresPositivos: string[] = [];
    const alertas: string[] = [];
    const recomendacoes: string[] = [];
    const fundamentacao: ItemFundamentacao[] = [];

    // Peso corporal
    const pesosMinimos: Record<string, number> = { bovino: 380, ovino: 45, caprino: 35 };
    const pesoMinimo = pesosMinimos[animal.especie] ?? 380;
    if (pesoAtual >= pesoMinimo) {
      score += 25;
      fatoresPositivos.push(`Peso adequado (${pesoAtual} kg)`);
      fundamentacao.push({
        fator: 'Peso corporal',
        valorObservado: `${pesoAtual} kg`,
        pontuacao: '+25 pontos',
        referencia: `Peso mínimo recomendado para ${animal.especie} é ${pesoMinimo} kg. Animais abaixo desse peso apresentam menor taxa de ovulação e implantação embrionária. Fonte: Embrapa Pecuária Sudeste — Manejo Reprodutivo de Bovinos de Corte (2021).`,
      });
    } else if (pesoAtual > 0) {
      alertas.push(`Peso abaixo do ideal (${pesoAtual} kg — mínimo ${pesoMinimo} kg)`);
      recomendacoes.push('Melhorar suplementação nutricional antes da inseminação');
      fundamentacao.push({
        fator: 'Peso corporal',
        valorObservado: `${pesoAtual} kg`,
        pontuacao: '0 pontos (abaixo do mínimo)',
        referencia: `Peso mínimo recomendado para ${animal.especie} é ${pesoMinimo} kg. Déficit nutricional reduz secreção de LH e compromete ovulação. Fonte: Embrapa Pecuária Sudeste — Manejo Reprodutivo de Bovinos de Corte (2021).`,
      });
    }

    // Período pós-parto
    const diasPosParto = calcularDiasPosParto(animal.dataUltimoParto);
    if (diasPosParto === 0 || diasPosParto >= 60) {
      score += 20;
      if (diasPosParto >= 60) fatoresPositivos.push(`Pós-parto adequado (${diasPosParto} dias)`);
      fundamentacao.push({
        fator: 'Período pós-parto',
        valorObservado: diasPosParto === 0 ? 'Sem parto anterior registrado' : `${diasPosParto} dias`,
        pontuacao: '+20 pontos',
        referencia: 'Intervalo parto-concepção mínimo de 60 dias necessário para involução uterina completa e retorno da ciclicidade ovariana. Fonte: Hafez & Hafez — Reprodução Animal, 7ª ed. (2004); CBRA — Manual para Exame Andrológico (2013).',
      });
    } else {
      alertas.push(`Pós-parto curto (${diasPosParto} dias — ideal ≥ 60)`);
      recomendacoes.push('Aguardar período pós-parto mínimo de 60 dias');
      fundamentacao.push({
        fator: 'Período pós-parto',
        valorObservado: `${diasPosParto} dias`,
        pontuacao: '0 pontos (período insuficiente)',
        referencia: 'Inseminação antes de 60 dias pós-parto reduz taxa de concepção em até 30% devido à involução uterina incompleta. Fonte: Hafez & Hafez — Reprodução Animal, 7ª ed. (2004).',
      });
    }

    // Histórico reprodutivo
    if (animal.historicoPrenhez > 0) {
      score += 15;
      fatoresPositivos.push(`Histórico reprodutivo positivo (${animal.historicoPrenhez} prenhezes anteriores)`);
      fundamentacao.push({
        fator: 'Histórico reprodutivo',
        valorObservado: `${animal.historicoPrenhez} prenhezes anteriores`,
        pontuacao: '+15 pontos',
        referencia: 'Fêmeas com prenhezes anteriores demonstram fertilidade comprovada e menor probabilidade de subfertilidade idiopática. Fonte: ASBIA — Relatório Estatístico 2022.',
      });
    } else {
      fundamentacao.push({
        fator: 'Histórico reprodutivo',
        valorObservado: 'Nenhuma prenhez registrada',
        pontuacao: '0 pontos',
        referencia: 'Ausência de histórico não penaliza, mas não agrega pontuação positiva. Animal nulíparo pode ter fertilidade normal — avaliação veterinária individualizada recomendada.',
      });
    }

    // Histórico de abortos
    if (animal.quantidadeAbortos === 0) {
      score += 10;
      fatoresPositivos.push('Sem histórico de abortos');
      fundamentacao.push({
        fator: 'Histórico de abortos',
        valorObservado: '0 abortos',
        pontuacao: '+10 pontos',
        referencia: 'Ausência de abortos indica integridade reprodutiva. Abortos recorrentes associados a brucelose, leptospirose ou deficiências nutricionais reduzem significativamente a taxa de prenhez. Fonte: MAPA — PNCEBT.',
      });
    } else {
      alertas.push(`Histórico de ${animal.quantidadeAbortos} aborto(s)`);
      fundamentacao.push({
        fator: 'Histórico de abortos',
        valorObservado: `${animal.quantidadeAbortos} aborto(s)`,
        pontuacao: '0 pontos (fator de risco)',
        referencia: 'Histórico de abortos exige investigação de causas infecciosas (brucelose, IBR, BVD) e nutricionais. Fêmeas com abortos repetidos têm taxa de prenhez até 25% inferior. Fonte: MAPA — PNCEBT; Embrapa Gado de Leite (2020).',
      });
    }

    // Escore de Condição Corporal
    if (animal.scoreCondicaoCorporal >= 3) {
      score += 10;
      fatoresPositivos.push(`Boa condição corporal (escore ${animal.scoreCondicaoCorporal}/5)`);
      fundamentacao.push({
        fator: 'Escore de Condição Corporal (ECC)',
        valorObservado: `${animal.scoreCondicaoCorporal}/5`,
        pontuacao: '+10 pontos',
        referencia: 'ECC ≥ 3 associado a balanço energético positivo e adequada secreção de hormônios reprodutivos (GnRH, LH, FSH). Fonte: Embrapa — Escore de Condição Corporal em Bovinos de Corte (2019).',
      });
    } else {
      alertas.push(`Condição corporal baixa (escore ${animal.scoreCondicaoCorporal}/5)`);
      recomendacoes.push('Melhorar condição corporal antes do protocolo');
      fundamentacao.push({
        fator: 'Escore de Condição Corporal (ECC)',
        valorObservado: `${animal.scoreCondicaoCorporal}/5`,
        pontuacao: '0 pontos (abaixo do ideal)',
        referencia: 'ECC < 3 indica balanço energético negativo, suprimindo o eixo hipotálamo-hipófise-gonadal e reduzindo taxa de ovulação em até 40%. Fonte: Embrapa (2019).',
      });
    }

    // Saúde reprodutiva
    if (!animal.historicoDoencaReprodutiva) {
      score += 10;
      fatoresPositivos.push('Sem histórico de doenças reprodutivas');
      fundamentacao.push({
        fator: 'Saúde reprodutiva',
        valorObservado: 'Sem ocorrências',
        pontuacao: '+10 pontos',
        referencia: 'Ausência de doenças reprodutivas preserva integridade do trato reprodutivo. Fonte: Gimenes et al. — Bovine follicular dynamics (Theriogenology, 2008).',
      });
    } else {
      alertas.push('Animal com histórico de doença reprodutiva');
      recomendacoes.push('Avaliação veterinária prévia recomendada');
      fundamentacao.push({
        fator: 'Saúde reprodutiva',
        valorObservado: 'Histórico positivo',
        pontuacao: '0 pontos (fator de risco)',
        referencia: 'Endometrite subclínica reduz taxa de prenhez em 15-30%. Avaliação ultrassonográfica recomendada antes do protocolo. Fonte: LeBlanc et al. (J. Dairy Sci., 2011).',
      });
    }

    // Status reprodutivo
    if (animal.statusReproducao === 'Apto') {
      score += 5;
      fatoresPositivos.push('Animal com status Apto');
      fundamentacao.push({
        fator: 'Status reprodutivo',
        valorObservado: 'Apto',
        pontuacao: '+5 pontos',
        referencia: 'Status "Apto" indica que o animal foi avaliado e liberado para reprodução pelo responsável técnico.',
      });
    } else if (animal.statusReproducao === 'Prenhe') {
      alertas.push('Animal já está prenhe');
      fundamentacao.push({
        fator: 'Status reprodutivo',
        valorObservado: 'Prenhe',
        pontuacao: '0 pontos (contraindicado)',
        referencia: 'Inseminação em animal prenhe é contraindicada e pode causar abortamento.',
      });
    }

    // Score do reprodutor
    if (reprodutor) {
      if (reprodutor.scoreFertilidade >= 80) {
        score += 10;
        fatoresPositivos.push(`Reprodutor com alta fertilidade (score ${reprodutor.scoreFertilidade})`);
        fundamentacao.push({
          fator: 'Score do reprodutor',
          valorObservado: `${reprodutor.nome} — score ${reprodutor.scoreFertilidade}/100`,
          pontuacao: '+10 pontos',
          referencia: `Score ≥ 80 indica alta taxa de concepção esperada. Calculado com base em ${reprodutor.totalInseminacoes} inseminação(ões) registrada(s) combinada com estimativa por raça.`,
        });
      } else if (reprodutor.scoreFertilidade >= 60) {
        score += 5;
        fatoresPositivos.push(`Reprodutor com fertilidade razoável (score ${reprodutor.scoreFertilidade})`);
        fundamentacao.push({
          fator: 'Score do reprodutor',
          valorObservado: `${reprodutor.nome} — score ${reprodutor.scoreFertilidade}/100`,
          pontuacao: '+5 pontos',
          referencia: `Score entre 60 e 79 indica fertilidade razoável. Calculado com base em ${reprodutor.totalInseminacoes} inseminação(ões) registrada(s).`,
        });
      } else {
        alertas.push(`Reprodutor com fertilidade abaixo do ideal (score ${reprodutor.scoreFertilidade})`);
        recomendacoes.push('Considerar troca de reprodutor');
        fundamentacao.push({
          fator: 'Score do reprodutor',
          valorObservado: `${reprodutor.nome} — score ${reprodutor.scoreFertilidade}/100`,
          pontuacao: '0 pontos (abaixo do ideal)',
          referencia: `Score < 60 indica baixa taxa de concepção esperada. Recomenda-se exame andrológico completo (CBRA, 2013).`,
        });
      }
    }

    // Protocolo reprodutivo
    if (dto.protocolo === 'IATF' || dto.protocolo === 'IATF com eCG') {
      score += 5;
      fatoresPositivos.push(`Protocolo ${dto.protocolo} — alta precisão de sincronização`);
      fundamentacao.push({
        fator: 'Protocolo reprodutivo',
        valorObservado: dto.protocolo,
        pontuacao: '+5 pontos',
        referencia: `IATF permite sincronização precisa da ovulação. Taxa média de prenhez com IATF no Brasil: 50-60%. Fonte: Baruselli et al. (Anim. Reprod. Sci., 2004).`,
      });
    } else if (dto.protocolo) {
      fundamentacao.push({
        fator: 'Protocolo reprodutivo',
        valorObservado: dto.protocolo,
        pontuacao: '0 pontos adicionais',
        referencia: 'Protocolo registrado para fins de rastreabilidade. IATF e IATF com eCG recebem bonificação por eficiência comprovada.',
      });
    }

    // Temperatura ambiente
    if (dto.temperaturaAmbiente && dto.temperaturaAmbiente > 32) {
      score -= 5;
      alertas.push(`Temperatura elevada (${dto.temperaturaAmbiente}°C) — risco de estresse térmico`);
      recomendacoes.push('Realizar inseminação no período mais fresco do dia (madrugada/manhã cedo)');
      fundamentacao.push({
        fator: 'Temperatura ambiente',
        valorObservado: `${dto.temperaturaAmbiente}°C`,
        pontuacao: '-5 pontos',
        referencia: 'Temperatura acima de 32°C causa estresse térmico, reduzindo qualidade oocitária e sobrevivência embrionária em até 20%. Fonte: Hansen (Anim. Reprod. Sci., 2009).',
      });
    }

    // Estação do ano
    if (dto.estacaoAno === 'seca') {
      score -= 5;
      alertas.push('Estação seca — maior risco nutricional');
      recomendacoes.push('Garantir suplementação durante o período seco');
      fundamentacao.push({
        fator: 'Estação do ano',
        valorObservado: 'Seca',
        pontuacao: '-5 pontos',
        referencia: 'No semiárido nordestino, a estação seca reduz disponibilidade de forragem nativa, levando a balanço energético negativo. Fonte: Embrapa Caprinos e Ovinos (2020).',
      });
    } else if (dto.estacaoAno === 'chuvosa') {
      fundamentacao.push({
        fator: 'Estação do ano',
        valorObservado: 'Chuvosa',
        pontuacao: '0 pontos (condição favorável)',
        referencia: 'Estação chuvosa favorece disponibilidade de forragem e balanço energético positivo. Fonte: Embrapa Caprinos e Ovinos (2020).',
      });
    }

    // Taxa histórica da fazenda
    if (animal.fazenda.taxaMediaPrenhez >= 65) {
      score += 5;
      fatoresPositivos.push(`Fazenda com boa taxa histórica (${animal.fazenda.taxaMediaPrenhez}%)`);
      fundamentacao.push({
        fator: 'Taxa histórica da fazenda',
        valorObservado: `${animal.fazenda.taxaMediaPrenhez}%`,
        pontuacao: '+5 pontos',
        referencia: 'Taxa de prenhez ≥ 65% indica manejo reprodutivo eficiente. Média nacional: 55-60%. Fonte: ASBIA 2022.',
      });
    }

    score = Math.max(0, Math.min(100, score));

    if (recomendacoes.length === 0) {
      recomendacoes.push('Realizar diagnóstico de gestação entre 28-35 dias pós-inseminação');
    } else {
      recomendacoes.push('Monitorar prenhez em 30 dias');
    }

    const scoreFinal = Math.round(35 + score * 0.6);

    return {
      probabilidadePrenhez: scoreFinal,
      scoreFertilidade: score,
      nivelRisco: score >= 70 ? 'baixo' : score >= 45 ? 'moderado' : 'alto',
      compatibilidadeGenetica: reprodutor ? Math.min(100, reprodutor.scoreFertilidade + 5) : null,
      fatoresPositivos,
      alertas,
      recomendacoes,
      fundamentacao,
      formulaProbabilidade: `Probabilidade = 35% (base) + ${score} pontos × 0,6 = ${scoreFinal}%. Score composto por ${fundamentacao.length} fatores avaliados individualmente com pesos definidos por literatura zootécnica. Intervalo possível: 35% (score 0) a 95% (score 100).`,
      protocolo: dto.protocolo,
    };
  }
}
