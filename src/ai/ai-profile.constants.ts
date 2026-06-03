export interface AiProfileConfig {
  id: string;
  name: string;
  icon: string;
  summary: string;
  description: string;
  callsAi: boolean;
  maxOutputTokens: number;
  temperature: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  costUsdPer1000: number;
  estimatedLatency: string;
}

export const AI_PROFILES: Record<string, AiProfileConfig> = {
  essential: {
    id: 'essential',
    name: 'Essencial',
    icon: '⚡',
    summary: 'Apenas cálculo local, sem custo de IA',
    description: 'Pontuação rápida sem chamadas de API. Recomendado para operações de alto volume.',
    callsAi: false,
    maxOutputTokens: 0,
    temperature: 0,
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    costUsdPer1000: 0,
    estimatedLatency: '< 200 ms',
  },
  brief: {
    id: 'brief',
    name: 'Rápido',
    icon: '💬',
    summary: 'Recomendação da IA em uma frase',
    description: 'Uma frase prática gerada pela IA com a principal recomendação.',
    callsAi: true,
    maxOutputTokens: 80,
    temperature: 0.7,
    estimatedInputTokens: 50,
    estimatedOutputTokens: 60,
    costUsdPer1000: 0.04,
    estimatedLatency: '< 1 segundo',
  },
  standard: {
    id: 'standard',
    name: 'Padrão',
    icon: '📋',
    summary: 'Análise em 1–2 frases',
    description: 'Análise equilibrada com os principais fatores e uma recomendação prática.',
    callsAi: true,
    maxOutputTokens: 200,
    temperature: 0.6,
    estimatedInputTokens: 80,
    estimatedOutputTokens: 180,
    costUsdPer1000: 0.12,
    estimatedLatency: '1–2 segundos',
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    icon: '🔬',
    summary: 'Relatório técnico completo',
    description: 'Relatório técnico detalhado com todos os fatores zootécnicos analisados.',
    callsAi: true,
    maxOutputTokens: 450,
    temperature: 0.4,
    estimatedInputTokens: 180,
    estimatedOutputTokens: 400,
    costUsdPer1000: 0.27,
    estimatedLatency: '3–5 segundos',
  },
};

export const VALID_AI_PROFILES = Object.keys(AI_PROFILES);
export type AiProfileId = 'essential' | 'brief' | 'standard' | 'expert';

export const AI_PRICING = {
  /** GPT-4o-mini: US$ 0.150 per 1M input tokens */
  inputPerToken: 0.15 / 1_000_000,
  /** GPT-4o-mini: US$ 0.600 per 1M output tokens */
  outputPerToken: 0.60 / 1_000_000,
  /** Reference BRL/USD exchange rate for cost display */
  usdToBrl: 5.7,
} as const;

export function calcCostUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * AI_PRICING.inputPerToken + outputTokens * AI_PRICING.outputPerToken;
}
