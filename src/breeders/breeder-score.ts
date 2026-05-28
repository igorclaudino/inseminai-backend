import OpenAI from 'openai';

// Base scores by breed from zootechnical literature for semi-arid conditions.
const BREED_SCORES: Record<string, number> = {
  // Cattle
  'nelore': 85, 'angus': 82, 'braford': 80, 'brangus': 78,
  'brahman': 83, 'gir': 78, 'girolando': 72, 'simental': 79,
  'senepol': 84, 'tabapuã': 81, 'canchim': 79, 'limousin': 77,
  'hereford': 80, 'santa gertrudis': 78, 'caracu': 76, 'guzerá': 80, 'sindi': 82,
  // Sheep
  'dorper': 88, 'santa inês': 85, 'morada nova': 82, 'somali': 83,
  'bergamácia': 78, 'ile de france': 80, 'suffolk': 79, 'texel': 78,
  // Goats
  'boer': 85, 'saanen': 80, 'toggenburg': 78, 'alpina': 78,
  'anglonubiana': 79, 'canindé': 76, 'moxotó': 74, 'repartida': 73,
};

const DEFAULT_SCORE_BY_SPECIES: Record<string, number> = {
  cattle: 75,
  sheep: 78,
  goat: 76,
};

export async function estimateBreederScore(species: string, breed: string): Promise<number> {
  const key = breed.toLowerCase().trim();

  const tableScore = BREED_SCORES[key];
  if (tableScore !== undefined) return tableScore;

  for (const [knownBreed, score] of Object.entries(BREED_SCORES)) {
    if (key.includes(knownBreed) || knownBreed.includes(key)) return score;
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Você é um zootecnista especializado em reprodução animal no semiárido nordestino brasileiro.
Estime o score de fertilidade esperado (0-100) para a raça "${breed}" da espécie "${species}".
Considere condições típicas do sertão: clima quente, manejo semi-extensivo, forragem nativa.
Responda APENAS com um número inteiro entre 0 e 100. Nenhum texto adicional.`,
        }],
        max_tokens: 10,
        temperature: 0.2,
      });

      const text = response.choices[0]?.message?.content?.trim() ?? '';
      const score = parseInt(text, 10);
      if (!isNaN(score) && score >= 0 && score <= 100) return score;
    } catch {
      // fall through to default
    }
  }

  return DEFAULT_SCORE_BY_SPECIES[species] ?? 75;
}

export function calcBlendedScore(
  pregnancies: number,
  totalInseminations: number,
  estimatedScore: number,
): number {
  if (totalInseminations === 0) return estimatedScore;

  const actualScore = Math.round((pregnancies / totalInseminations) * 100);
  const actualWeight = Math.min(totalInseminations / 10, 1.0);

  return Math.round(actualWeight * actualScore + (1 - actualWeight) * estimatedScore);
}
