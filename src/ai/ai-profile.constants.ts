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
    name: 'Essential',
    icon: '⚡',
    summary: 'Local analysis only, zero AI cost',
    description: 'Fast scoring with no API calls. Recommended for high-volume operations.',
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
    name: 'Brief',
    icon: '💬',
    summary: 'Single-sentence AI insight',
    description: 'One practical recommendation sentence from the AI.',
    callsAi: true,
    maxOutputTokens: 45,
    temperature: 0.7,
    estimatedInputTokens: 35,
    estimatedOutputTokens: 35,
    costUsdPer1000: 0.026,
    estimatedLatency: '< 1 second',
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    icon: '📋',
    summary: '1–2 sentence analysis',
    description: 'Balanced analysis with key factors and a practical recommendation.',
    callsAi: true,
    maxOutputTokens: 90,
    temperature: 0.6,
    estimatedInputTokens: 50,
    estimatedOutputTokens: 80,
    costUsdPer1000: 0.056,
    estimatedLatency: '1–2 seconds',
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    icon: '🔬',
    summary: 'Full technical report',
    description: 'Detailed technical report with all zootechnical factors analyzed.',
    callsAi: true,
    maxOutputTokens: 300,
    temperature: 0.4,
    estimatedInputTokens: 130,
    estimatedOutputTokens: 250,
    costUsdPer1000: 0.17,
    estimatedLatency: '3–5 seconds',
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
