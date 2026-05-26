import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { PreverPrenhezDto } from './dto/prever-prenhez.dto';
import { calcularDiasPosParto } from '../common/helpers/dias-pos-parto';

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
}

@Injectable()
export class IaService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async preverPrenhez(dto: PreverPrenhezDto, usuarioId: string): Promise<ResultadoPredicao> {
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

    resultado.insightGpt = await this.gerarInsight(animal, pesoAtual, resultado, reprodutor, dto.protocolo);

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
        ...(dto.reprodutorId && { reprodutorId: dto.reprodutorId }),
      },
    });

    return resultado;
  }

  private calcularScore(animal: any, pesoAtual: number, reprodutor: any, dto: PreverPrenhezDto): ResultadoPredicao {
    let score = 0;
    const fatoresPositivos: string[] = [];
    const alertas: string[] = [];
    const recomendacoes: string[] = [];
    const fundamentacao: ItemFundamentacao[] = [];

    // Peso corporal — peso mínimo por espécie baseado em Embrapa / literatura zootécnica
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

    // Período pós-parto — intervalo mínimo de 60 dias para involução uterina
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

    // Histórico reprodutivo — prenhezes anteriores indicam fertilidade comprovada
    if (animal.historicoPrenhez > 0) {
      score += 15;
      fatoresPositivos.push(`Histórico reprodutivo positivo (${animal.historicoPrenhez} prenhezes anteriores)`);
      fundamentacao.push({
        fator: 'Histórico reprodutivo',
        valorObservado: `${animal.historicoPrenhez} prenhezes anteriores`,
        pontuacao: '+15 pontos',
        referencia: 'Fêmeas com prenhezes anteriores demonstram fertilidade comprovada e menor probabilidade de subfertilidade idiopática. Fonte: Associação Brasileira de Inseminação Artificial — ASBIA, Relatório Estatístico 2022.',
      });
    } else {
      fundamentacao.push({
        fator: 'Histórico reprodutivo',
        valorObservado: 'Nenhuma prenhez registrada',
        pontuacao: '0 pontos',
        referencia: 'Ausência de histórico não penaliza, mas não agrega pontuação positiva. Animal nulíparo pode ter fertilidade normal — avaliação veterinária individualizada recomendada.',
      });
    }

    // Abortos — histórico de abortos indica risco reprodutivo aumentado
    if (animal.quantidadeAbortos === 0) {
      score += 10;
      fatoresPositivos.push('Sem histórico de abortos');
      fundamentacao.push({
        fator: 'Histórico de abortos',
        valorObservado: '0 abortos',
        pontuacao: '+10 pontos',
        referencia: 'Ausência de abortos indica integridade reprodutiva. Abortos recorrentes associados a brucelose, leptospirose ou deficiências nutricionais reduzem significativamente a taxa de prenhez. Fonte: MAPA — Programa Nacional de Controle e Erradicação da Brucelose e Tuberculose (PNCEBT).',
      });
    } else {
      alertas.push(`Histórico de ${animal.quantidadeAbortos} aborto(s)`);
      fundamentacao.push({
        fator: 'Histórico de abortos',
        valorObservado: `${animal.quantidadeAbortos} aborto(s)`,
        pontuacao: '0 pontos (fator de risco)',
        referencia: 'Histórico de abortos exige investigação de causas infecciosas (brucelose, IBR, BVD) e nutricionais. Fêmeas com abortos repetidos têm taxa de prenhez até 25% inferior. Fonte: MAPA — PNCEBT; Embrapa Gado de Leite — Doenças Reprodutivas (2020).',
      });
    }

    // Escore de Condição Corporal (ECC) — escala 1 a 5, ideal ≥ 3
    if (animal.scoreCondicaoCorporal >= 3) {
      score += 10;
      fatoresPositivos.push(`Boa condição corporal (escore ${animal.scoreCondicaoCorporal}/5)`);
      fundamentacao.push({
        fator: 'Escore de Condição Corporal (ECC)',
        valorObservado: `${animal.scoreCondicaoCorporal}/5`,
        pontuacao: '+10 pontos',
        referencia: 'ECC ≥ 3 associado a balanço energético positivo e adequada secreção de hormônios reprodutivos (GnRH, LH, FSH). Escala de 1 a 5 conforme metodologia Nicholson & Butterworth. Fonte: Embrapa — Escore de Condição Corporal em Bovinos de Corte (2019).',
      });
    } else {
      alertas.push(`Condição corporal baixa (escore ${animal.scoreCondicaoCorporal}/5)`);
      recomendacoes.push('Melhorar condição corporal antes do protocolo');
      fundamentacao.push({
        fator: 'Escore de Condição Corporal (ECC)',
        valorObservado: `${animal.scoreCondicaoCorporal}/5`,
        pontuacao: '0 pontos (abaixo do ideal)',
        referencia: 'ECC < 3 indica balanço energético negativo, suprimindo o eixo hipotálamo-hipófise-gonadal e reduzindo taxa de ovulação em até 40%. Fonte: Embrapa — Escore de Condição Corporal em Bovinos de Corte (2019).',
      });
    }

    // Saúde reprodutiva — doenças comprometem fertilidade
    if (!animal.historicoDoencaReprodutiva) {
      score += 10;
      fatoresPositivos.push('Sem histórico de doenças reprodutivas');
      fundamentacao.push({
        fator: 'Saúde reprodutiva',
        valorObservado: 'Sem ocorrências',
        pontuacao: '+10 pontos',
        referencia: 'Ausência de doenças reprodutivas (metrite, endometrite, cistos ovarianos) preserva integridade do trato reprodutivo. Fonte: Gimenes et al. — Bovine follicular dynamics (Theriogenology, 2008).',
      });
    } else {
      alertas.push('Animal com histórico de doença reprodutiva');
      recomendacoes.push('Avaliação veterinária prévia recomendada');
      fundamentacao.push({
        fator: 'Saúde reprodutiva',
        valorObservado: 'Histórico positivo',
        pontuacao: '0 pontos (fator de risco)',
        referencia: 'Endometrite subclínica reduz taxa de prenhez em 15-30%. Cistos ovarianos afetam ciclicidade. Avaliação ultrassonográfica recomendada antes do protocolo. Fonte: LeBlanc et al. — Defining and diagnosing postpartum clinical endometritis (J. Dairy Sci., 2011).',
      });
    }

    // Status reprodutivo atual
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

    // Qualidade do reprodutor — score de fertilidade calculado com base em dados reais + estimativa por raça
    if (reprodutor) {
      if (reprodutor.scoreFertilidade >= 80) {
        score += 10;
        fatoresPositivos.push(`Reprodutor com alta fertilidade (score ${reprodutor.scoreFertilidade})`);
        fundamentacao.push({
          fator: 'Score do reprodutor',
          valorObservado: `${reprodutor.nome} — score ${reprodutor.scoreFertilidade}/100`,
          pontuacao: '+10 pontos',
          referencia: `Score ≥ 80 indica alta taxa de concepção esperada. Score calculado pelo sistema com base na taxa real de prenhez do reprodutor (${reprodutor.prenhezes} prenhezes em ${reprodutor.totalInseminacoes} inseminações) combinada com estimativa por raça. Metodologia: média ponderada com peso crescente dos dados reais conforme volume de inseminações.`,
        });
      } else if (reprodutor.scoreFertilidade >= 60) {
        score += 5;
        fatoresPositivos.push(`Reprodutor com fertilidade razoável (score ${reprodutor.scoreFertilidade})`);
        fundamentacao.push({
          fator: 'Score do reprodutor',
          valorObservado: `${reprodutor.nome} — score ${reprodutor.scoreFertilidade}/100`,
          pontuacao: '+5 pontos',
          referencia: `Score entre 60 e 79 indica fertilidade razoável. Taxa de concepção esperada entre 60-79%. Score calculado com base em ${reprodutor.totalInseminacoes} inseminação(ões) registrada(s).`,
        });
      } else {
        alertas.push(`Reprodutor com fertilidade abaixo do ideal (score ${reprodutor.scoreFertilidade})`);
        recomendacoes.push('Considerar troca de reprodutor');
        fundamentacao.push({
          fator: 'Score do reprodutor',
          valorObservado: `${reprodutor.nome} — score ${reprodutor.scoreFertilidade}/100`,
          pontuacao: '0 pontos (abaixo do ideal)',
          referencia: `Score < 60 indica baixa taxa de concepção esperada. Recomenda-se exame andrológico completo (CBRA) para avaliação de motilidade e morfologia espermática. Fonte: CBRA — Manual para Exame Andrológico e Avaliação de Sêmen Animal, 3ª ed. (2013).`,
        });
      }
    }

    // Protocolo reprodutivo — eficiência comprovada em literatura
    if (dto.protocolo === 'IATF' || dto.protocolo === 'IATF com eCG') {
      score += 5;
      fatoresPositivos.push(`Protocolo ${dto.protocolo} — alta precisão de sincronização`);
      fundamentacao.push({
        fator: 'Protocolo reprodutivo',
        valorObservado: dto.protocolo,
        pontuacao: '+5 pontos',
        referencia: `IATF (Inseminação Artificial em Tempo Fixo) permite sincronização precisa da ovulação, eliminando necessidade de detecção de cio e aumentando taxa de prenhez em rebanhos com manejo extensivo. Taxa média de prenhez com IATF no Brasil: 50-60%. Adição de eCG melhora resposta em novilhas e vacas em anestro. Fonte: Baruselli et al. — The use of hormonal treatments to improve reproductive performance of anestrous beef cattle (Anim. Reprod. Sci., 2004).`,
      });
    } else if (dto.protocolo) {
      fundamentacao.push({
        fator: 'Protocolo reprodutivo',
        valorObservado: dto.protocolo,
        pontuacao: '0 pontos adicionais',
        referencia: 'Protocolo registrado para fins de rastreabilidade. IATF e IATF com eCG recebem bonificação por eficiência comprovada em condições tropicais.',
      });
    }

    // Temperatura ambiente — estresse térmico acima de 32°C
    if (dto.temperaturaAmbiente && dto.temperaturaAmbiente > 32) {
      score -= 5;
      alertas.push(`Temperatura elevada (${dto.temperaturaAmbiente}°C) — risco de estresse térmico`);
      recomendacoes.push('Realizar inseminação no período mais fresco do dia (madrugada/manhã cedo)');
      fundamentacao.push({
        fator: 'Temperatura ambiente',
        valorObservado: `${dto.temperaturaAmbiente}°C`,
        pontuacao: '-5 pontos',
        referencia: 'Temperatura acima de 32°C causa estresse térmico, reduzindo qualidade oocitária, taxa de fertilização e sobrevivência embrionária inicial em até 20%. Índice de temperatura-umidade (ITU) > 72 é crítico. Fonte: Hansen — Reproductive physiology of the heat-stressed dairy cow (Anim. Reprod. Sci., 2009).',
      });
    }

    // Estação do ano — impacto nutricional e forrageiro
    if (dto.estacaoAno === 'seca') {
      score -= 5;
      alertas.push('Estação seca — maior risco nutricional');
      recomendacoes.push('Garantir suplementação durante o período seco');
      fundamentacao.push({
        fator: 'Estação do ano',
        valorObservado: 'Seca',
        pontuacao: '-5 pontos',
        referencia: 'No semiárido nordestino, a estação seca reduz disponibilidade de forragem nativa, levando a balanço energético negativo e supressão do eixo reprodutivo. Suplementação proteico-energética é essencial para manutenção da ciclicidade. Fonte: Embrapa Caprinos e Ovinos — Manejo Alimentar no Semiárido (2020); Moraes et al. — Sazonalidade reprodutiva em caprinos e ovinos no Nordeste (Rev. Bras. Zootec., 2002).',
      });
    } else if (dto.estacaoAno === 'chuvosa') {
      fundamentacao.push({
        fator: 'Estação do ano',
        valorObservado: 'Chuvosa',
        pontuacao: '0 pontos (neutro — condição favorável)',
        referencia: 'Estação chuvosa favorece disponibilidade de forragem e balanço energético positivo, contribuindo indiretamente para melhor performance reprodutiva no semiárido. Fonte: Embrapa Caprinos e Ovinos — Manejo Alimentar no Semiárido (2020).',
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
        referencia: 'Taxa de prenhez ≥ 65% indica manejo reprodutivo eficiente e condições sanitárias e nutricionais adequadas. Média nacional para bovinos de corte: 55-60%. Fonte: ASBIA — Relatório de Mercado de Sêmen 2022.',
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

  private async gerarInsight(animal: any, pesoAtual: number, resultado: ResultadoPredicao, reprodutor: any, protocolo?: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) return '';

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Você é um especialista em reprodução animal para o contexto do sertão nordestino brasileiro. Gere um insight técnico resumido (máximo 2-3 frases curtas) para um técnico ou produtor rural.

Dados:
- Animal: ${animal.especie} ${animal.raca}, ${pesoAtual} kg
- Histórico: ${animal.historicoPrenhez} prenhezes, ${animal.quantidadeAbortos} abortos
- Status: ${animal.statusReproducao}
- Protocolo: ${protocolo ?? 'não informado'}
- Reprodutor: ${reprodutor ? `${reprodutor.nome} (score ${reprodutor.scoreFertilidade})` : 'não informado'}
- Probabilidade de prenhez: ${resultado.probabilidadePrenhez}%
- Risco: ${resultado.nivelRisco}
- Alertas: ${resultado.alertas.join('; ') || 'nenhum'}

Seja direto e prático. Não use jargão excessivo.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.6,
      });

      return response.choices[0]?.message?.content?.trim() ?? '';
    } catch (err) {
      console.error('[IA] Erro ao chamar OpenAI:', err instanceof Error ? err.message : err);
      return '';
    }
  }

  async recomendarReprodutor(fazendaId: string, animalId: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda || fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal não encontrado');

    const reprodutores = await this.prisma.reprodutor.findMany({
      where: { fazendaId, especie: animal.especie, ativo: true },
      orderBy: { scoreFertilidade: 'desc' },
      take: 5,
    });

    return reprodutores.map((r: typeof reprodutores[0]) => ({
      ...r,
      classificacao: r.scoreFertilidade >= 80 ? 'Excelente' : r.scoreFertilidade >= 60 ? 'Bom' : 'Regular',
    }));
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
}
