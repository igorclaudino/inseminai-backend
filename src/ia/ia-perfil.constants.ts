// ─── Perfis de Análise de IA ─────────────────────────────────────────────────
//
// Define os quatro modos de operação da IA para predição de prenhez.
// A configuração é por fazenda (tenant), permitindo que cada operação
// escolha o nível de detalhe e custo adequado ao seu contexto.
//
// Precificação base (GPT-4o-mini):
//   - Entrada : US$ 0,150 por 1 M tokens  → US$ 0,00000015 / token
//   - Saída   : US$ 0,600 por 1 M tokens  → US$ 0,00000060 / token
// ─────────────────────────────────────────────────────────────────────────────

export interface PerfilIaConfig {
  id: string;
  nome: string;
  descricao: string;
  /** Texto de ajuda breve para exibir ao usuário final */
  resumo: string;
  /** Se false, nenhuma chamada à API de IA é feita (insight gerado localmente) */
  chamaIA: boolean;
  maxTokensSaida: number;
  temperature: number;
  /** Estimativa de tokens de entrada (prompt) por análise */
  tokensEntradaEstimados: number;
  /** Estimativa de tokens de saída por análise */
  tokensSaidaEstimados: number;
  /** Custo estimado em USD por 1.000 análises */
  custoUsdPor1000: number;
  latenciaEstimada: string;
  melhorPara: string[];
  icone: string;
}

export const PERFIS_IA: Record<string, PerfilIaConfig> = {

  // ── 1. Sem IA ──────────────────────────────────────────────────────────────
  essencial: {
    id: 'essencial',
    nome: 'Essencial',
    descricao:
      'Resultado imediato gerado diretamente pelos dados do rebanho, sem nenhuma chamada à IA. ' +
      'Ideal para consultas rápidas no campo, avaliações em lote ou situações com conectividade limitada.',
    resumo: 'Resultado imediato, sem IA',
    chamaIA: false,
    maxTokensSaida: 0,
    temperature: 0,
    tokensEntradaEstimados: 0,
    tokensSaidaEstimados: 0,
    custoUsdPor1000: 0,
    latenciaEstimada: '< 200 ms',
    melhorPara: [
      'Consultas rápidas no campo',
      'Avaliações em lote (muitos animais de uma vez)',
      'Conectividade limitada ou offline',
      'Redução máxima de custos operacionais',
    ],
    icone: '⚡',
  },

  // ── 2. IA mínima — 1 frase curta ─────────────────────────────────────────
  resumido: {
    id: 'resumido',
    nome: 'Resumido',
    descricao:
      'Uma frase direta gerada pela IA com a conclusão mais importante da análise. ' +
      'Mais contexto que o Essencial com consumo mínimo de IA.',
    resumo: 'Uma frase da IA com a conclusão principal',
    chamaIA: true,
    maxTokensSaida: 45,
    temperature: 0.4,
    // Prompt ultra-compacto → ~35 tokens de entrada, ~35 tokens de saída
    tokensEntradaEstimados: 35,
    tokensSaidaEstimados: 35,
    // (35 × 0,00000015) + (35 × 0,00000060) = 0,0000263 USD × 1000 ≈ 0,026 USD
    custoUsdPor1000: 0.026,
    latenciaEstimada: '< 1 segundo',
    melhorPara: [
      'Campo com conectividade reduzida',
      'Confirmação rápida de uma decisão já tomada',
      'Rotina de avaliação diária com muitos animais',
    ],
    icone: '💬',
  },

  // ── 3. IA equilibrada — 1-2 frases ──────────────────────────────────────
  padrao: {
    id: 'padrao',
    nome: 'Padrão',
    descricao:
      'Análise com resumo em linguagem simples gerado pela IA. ' +
      'Equilíbrio entre velocidade, custo e qualidade — recomendado para o uso diário na fazenda.',
    resumo: 'Resumo da IA em linguagem simples',
    chamaIA: true,
    maxTokensSaida: 90,
    temperature: 0.5,
    tokensEntradaEstimados: 50,
    tokensSaidaEstimados: 80,
    // (50 × 0,00000015) + (80 × 0,00000060) = 0,0000555 USD × 1000 ≈ 0,056 USD
    custoUsdPor1000: 0.056,
    latenciaEstimada: '1–2 segundos',
    melhorPara: [
      'Uso diário na fazenda',
      'Técnicos de campo',
      'Decisões de rotina no ciclo reprodutivo',
    ],
    icone: '📋',
  },

  // ── 4. IA completa — laudo técnico ──────────────────────────────────────
  especialista: {
    id: 'especialista',
    nome: 'Especialista',
    descricao:
      'Laudo completo com análise aprofundada, contextualização técnica e recomendações de manejo detalhadas ' +
      'voltadas ao semiárido nordestino. Indicado para decisões estratégicas e animais de alto valor genético.',
    resumo: 'Laudo detalhado com análise aprofundada',
    chamaIA: true,
    maxTokensSaida: 300,
    temperature: 0.7,
    tokensEntradaEstimados: 130,
    tokensSaidaEstimados: 250,
    // (130 × 0,00000015) + (250 × 0,00000060) = 0,0001695 USD × 1000 ≈ 0,170 USD
    custoUsdPor1000: 0.17,
    latenciaEstimada: '3–5 segundos',
    melhorPara: [
      'Decisões estratégicas de reprodução',
      'Apresentação a médicos veterinários',
      'Animais de alto valor genético',
      'Elaboração de laudos técnicos',
    ],
    icone: '🔬',
  },
};

export const PERFIS_VALIDOS = Object.keys(PERFIS_IA);

export type PerfilIaId = 'essencial' | 'resumido' | 'padrao' | 'especialista';
