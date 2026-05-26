import OpenAI from 'openai';

// Scores base por raça baseados em literatura zootécnica para condições do semiárido nordestino.
// Representa fertilidade esperada em condições normais de manejo (0-100).
const SCORES_RACA: Record<string, number> = {
  // Bovinos
  'nelore': 85,
  'angus': 82,
  'braford': 80,
  'brangus': 78,
  'brahman': 83,
  'gir': 78,
  'girolando': 72,
  'simental': 79,
  'senepol': 84,
  'tabapuã': 81,
  'canchim': 79,
  'limousin': 77,
  'hereford': 80,
  'santa gertrudis': 78,
  'caracu': 76,
  'guzerá': 80,
  'sindi': 82,
  // Ovinos
  'dorper': 88,
  'santa inês': 85,
  'morada nova': 82,
  'somali': 83,
  'bergamácia': 78,
  'ile de france': 80,
  'suffolk': 79,
  'texel': 78,
  // Caprinos
  'boer': 85,
  'saanen': 80,
  'toggenburg': 78,
  'alpina': 78,
  'anglonubiana': 79,
  'canindé': 76,
  'moxotó': 74,
  'repartida': 73,
};

const SCORE_PADRAO_POR_ESPECIE: Record<string, number> = {
  bovino: 75,
  ovino: 78,
  caprino: 76,
};

export async function estimarScoreReprodutor(especie: string, raca: string): Promise<number> {
  const chave = raca.toLowerCase().trim();

  // 1. Verificar tabela heurística
  const scoreTabelado = SCORES_RACA[chave];
  if (scoreTabelado !== undefined) return scoreTabelado;

  // 2. Correspondência parcial (ex: "Nelore Mocho" → "nelore")
  for (const [racaConhecida, score] of Object.entries(SCORES_RACA)) {
    if (chave.includes(racaConhecida) || racaConhecida.includes(chave)) {
      return score;
    }
  }

  // 3. Fallback: GPT para raças não mapeadas
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Você é um zootecnista especializado em reprodução animal no semiárido nordestino brasileiro.
Estime o score de fertilidade esperado (0-100) para a raça "${raca}" da espécie "${especie}".
Considere condições típicas do sertão: clima quente, manejo semi-extensivo, forragem nativa.
Responda APENAS com um número inteiro entre 0 e 100. Nenhum texto adicional.`,
          },
        ],
        max_tokens: 10,
        temperature: 0.2,
      });

      const texto = response.choices[0]?.message?.content?.trim() ?? '';
      const score = parseInt(texto, 10);
      if (!isNaN(score) && score >= 0 && score <= 100) return score;
    } catch {
      // ignora erro e usa fallback
    }
  }

  // 4. Fallback final por espécie
  return SCORE_PADRAO_POR_ESPECIE[especie] ?? 75;
}

/**
 * Calcula o score blendado entre estimativa de IA e dados reais.
 * Peso dos dados reais cresce de 0% a 100% conforme totalInseminacoes vai de 0 a 10.
 */
export function calcularScoreBlendado(
  prenhezes: number,
  totalInseminacoes: number,
  scoreEstimado: number,
): number {
  if (totalInseminacoes === 0) return scoreEstimado;

  const scoreReal = Math.round((prenhezes / totalInseminacoes) * 100);
  const pesoReal = Math.min(totalInseminacoes / 10, 1.0);

  return Math.round(pesoReal * scoreReal + (1 - pesoReal) * scoreEstimado);
}
