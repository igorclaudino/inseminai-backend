import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { Animal, Farm } from '@prisma/client';
import { AiProfileConfig } from './ai-profile.constants';
import { ScoreOutput } from '../domain/scoring/scoring.types';
import { PredictPregnancyDto } from './dto/predict-pregnancy.dto';
import { BestDamDto } from './dto/best-dam.dto';
import { calcDaysPostpartum } from '../common/helpers/days-postpartum';

export interface InsightResult {
  text: string;
  tokens: { input: number; output: number };
}

export interface AIPredictionResult {
  score: ScoreOutput;
  insight: string;
  tokens: { input: number; output: number };
}

export interface AIBreederRecommendationResult {
  ranking: Array<{ sireId: string; compatibility: number; classification: string }>;
  positiveFactors: string[];
  alerts: string[];
  recommendations: string[];
  aiInsight: string;
  tokens: { input: number; output: number };
}

export interface AIBestDamResult {
  ranking: Array<{
    animalId: string;
    pregnancyProbability: number;
    fertilityScore: number;
    riskLevel: 'low' | 'moderate' | 'high';
    positiveFactors: string[];
    alerts: string[];
  }>;
  recommendations: string[];
  aiInsight: string;
  tokens: { input: number; output: number };
}

type AnimalWithFarm = Animal & { farm: Farm };

@Injectable()
export class AiInsightsService {
  private readonly logger = new Logger(AiInsightsService.name);
  private openai: OpenAI | null;

  constructor() {
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  async predictWithAI(
    animal: Animal,
    currentWeight: number,
    sire: Animal | null,
    dto: PredictPregnancyDto,
    profile: AiProfileConfig,
  ): Promise<AIPredictionResult | null> {
    if (!this.openai) return null;

    const daysPostpartum = calcDaysPostpartum(animal.lastBirthDate);
    const sireText = sire
      ? `${sire.name}, raça ${sire.breed} (${sire.pregnanciesAsBreeder} prenhezes confirmadas em ${sire.totalInseminations} inseminações)`
      : 'não informado';

    const insightInstruction =
      profile.id === 'brief'
        ? `"aiInsight": "<1 frase citando um dado específico deste animal e o que ele implica para esta inseminação>"`
        : profile.id === 'expert'
          ? `"aiInsight": "<4-5 frases técnicas: analise cada fator determinante com os valores reais, ressalvas clínicas e recomendação de manejo específica para esta raça no semiárido>"`
          : `"aiInsight": "<2-3 frases técnicas citando dados específicos deste animal — sem orientações genéricas>"`;

    const factorsCount = profile.id === 'brief' ? 2 : profile.id === 'expert' ? 5 : 4;
    const maxTokens = profile.id === 'brief' ? 400 : profile.id === 'expert' ? 900 : 600;

    const prompt =
      `Você é veterinário especialista em reprodução animal no semiárido nordestino brasileiro.\n` +
      `Analise os dados clínicos abaixo e retorne uma predição de prenhez em JSON.\n\n` +
      `Dados clínicos:\n` +
      `- Espécie: ${animal.species} | Raça: ${animal.breed}\n` +
      `- Peso: ${currentWeight} kg | ECC: ${animal.bodyConditionScore}/5\n` +
      `- Histórico: ${animal.pregnancyHistory} prenhezes anteriores, ${animal.abortionCount} aborto(s)\n` +
      `${animal.reproductiveDiseaseHistory ? '- Histórico de doença reprodutiva: sim\n' : ''}` +
      `- Dias pós-parto: ${daysPostpartum > 0 ? daysPostpartum : 'sem parto anterior registrado'}\n` +
      `- Status reprodutivo: ${animal.reproductiveStatus}\n` +
      `- Protocolo: ${dto.protocol ?? 'não informado'}\n` +
      `- Reprodutor: ${sireText}\n` +
      `- Temperatura ambiente: ${dto.ambientTemperature ? `${dto.ambientTemperature}°C` : 'não informada'}\n` +
      `- Estação: ${dto.season ?? 'não informada'}\n\n` +
      `Retorne EXATAMENTE este JSON (sem markdown):\n` +
      `{\n` +
      `  "pregnancyProbability": <inteiro 35-95>,\n` +
      `  "fertilityScore": <inteiro 0-100 — aptidão reprodutiva geral>,\n` +
      `  "riskLevel": <"low" se prob>=70, "moderate" se 55-69, "high" se <55>,\n` +
      `  "geneticCompatibility": <inteiro 0-100 ou null se reprodutor não informado>,\n` +
      `  "positiveFactors": [<até ${factorsCount} fatores favoráveis em português>],\n` +
      `  "alerts": [<até ${factorsCount} achados preocupantes em português>],\n` +
      `  "recommendations": [<até ${profile.id === 'expert' ? 5 : 3} ações concretas em português>],\n` +
      `  ${insightInstruction}\n` +
      `}`;

    const start = Date.now();
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
        temperature: profile.temperature,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (
        typeof parsed.pregnancyProbability !== 'number' ||
        typeof parsed.fertilityScore !== 'number' ||
        !['low', 'moderate', 'high'].includes(parsed.riskLevel)
      ) return null;

      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      this.logger.log(`predictWithAI — ${inputTokens} in / ${outputTokens} out — ${Date.now() - start}ms`);

      const score: ScoreOutput = {
        pregnancyProbability: Math.max(35, Math.min(95, Math.round(parsed.pregnancyProbability))),
        fertilityScore: Math.max(0, Math.min(100, Math.round(parsed.fertilityScore))),
        riskLevel: parsed.riskLevel as 'low' | 'moderate' | 'high',
        geneticCompatibility: typeof parsed.geneticCompatibility === 'number' ? parsed.geneticCompatibility : null,
        positiveFactors: Array.isArray(parsed.positiveFactors) ? parsed.positiveFactors : [],
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        protocol: dto.protocol,
      };

      return {
        score,
        insight: typeof parsed.aiInsight === 'string' ? parsed.aiInsight.trim() : '',
        tokens: { input: inputTokens, output: outputTokens },
      };
    } catch (err) {
      this.logger.error(`predictWithAI — fallback ao algoritmo — ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async recommendBreederWithAI(
    female: Animal,
    currentWeight: number,
    males: Animal[],
    profile: AiProfileConfig,
  ): Promise<AIBreederRecommendationResult | null> {
    if (!this.openai) return null;

    const daysPostpartum = calcDaysPostpartum(female.lastBirthDate);
    const maleList = males.slice(0, 5).map((m, i) =>
      `${i + 1}. ID:${m.id} | ${m.name} — ${m.breed} | ` +
      `${m.pregnanciesAsBreeder} prenhezes confirmadas em ${m.totalInseminations} inseminações`,
    ).join('\n');

    const insightInstruction =
      profile.id === 'brief'
        ? `"aiInsight": "<1 frase: qual reprodutor escolheria para esta fêmea e por quê — cite o dado que justifica>"`
        : profile.id === 'expert'
          ? `"aiInsight": "<4-5 frases: analise a compatibilidade de raça, histórico real de cada reprodutor, ressalvas clínicas da fêmea e manejo pós-cobertura específico para esta espécie no semiárido>"`
          : `"aiInsight": "<2-3 frases técnicas citando dados reais dos reprodutores e da fêmea>"`;

    const factorsCount = profile.id === 'brief' ? 2 : profile.id === 'expert' ? 5 : 3;
    const maxTokens = profile.id === 'brief' ? 400 : profile.id === 'expert' ? 900 : 600;

    const prompt =
      `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
      `Fêmea para inseminação:\n` +
      `- Espécie/Raça: ${female.species} ${female.breed}\n` +
      `- Peso: ${currentWeight}kg | ECC: ${female.bodyConditionScore}/5\n` +
      `- Histórico: ${female.pregnancyHistory} prenhezes, ${female.abortionCount} aborto(s)` +
      `${female.reproductiveDiseaseHistory ? ', histórico de doença reprodutiva' : ''}\n` +
      `- Pós-parto: ${daysPostpartum > 0 ? `${daysPostpartum} dias` : 'sem parto anterior'}\n` +
      `- Status: ${female.reproductiveStatus}\n\n` +
      `Reprodutores disponíveis:\n${maleList}\n\n` +
      `REGRA: justifique cada posição citando os dados reais de prenhezes e raça — sem generalidades.\n\n` +
      `Retorne EXATAMENTE este JSON (sem markdown):\n` +
      `{\n` +
      `  "ranking": [{ "sireId": "<ID exato do item acima>", "compatibility": <0-100>, "classification": <"Excelente"|"Muito Bom"|"Bom"|"Regular"> }],\n` +
      `  "positiveFactors": [<até ${factorsCount} fatores favoráveis em português>],\n` +
      `  "alerts": [<até ${factorsCount} alertas em português>],\n` +
      `  "recommendations": [<até ${profile.id === 'expert' ? 5 : 3} recomendações em português>],\n` +
      `  ${insightInstruction}\n` +
      `}`;

    const start = Date.now();
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
        temperature: profile.temperature,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed.ranking) || parsed.ranking.length === 0) return null;

      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      this.logger.log(`recommendBreederWithAI — ${inputTokens} in / ${outputTokens} out — ${Date.now() - start}ms`);

      return {
        ranking: parsed.ranking
          .filter((r: any) => typeof r.sireId === 'string' && typeof r.compatibility === 'number')
          .map((r: any) => ({
            sireId: r.sireId,
            compatibility: Math.max(0, Math.min(100, Math.round(r.compatibility))),
            classification: ['Excelente', 'Muito Bom', 'Bom', 'Regular'].includes(r.classification) ? r.classification : 'Bom',
          })),
        positiveFactors: Array.isArray(parsed.positiveFactors) ? parsed.positiveFactors : [],
        alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        aiInsight: typeof parsed.aiInsight === 'string' ? parsed.aiInsight.trim() : '',
        tokens: { input: inputTokens, output: outputTokens },
      };
    } catch (err) {
      this.logger.error(`recommendBreederWithAI — fallback ao algoritmo — ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async bestDamWithAI(
    candidates: Array<{ animal: Animal & { farm: any }; currentWeight: number }>,
    dto: { protocol?: string; ambientTemperature?: number; season?: string },
    profile: AiProfileConfig,
  ): Promise<AIBestDamResult | null> {
    if (!this.openai) return null;

    const candidateList = candidates.map((c, i) => {
      const days = calcDaysPostpartum(c.animal.lastBirthDate);
      return (
        `${i + 1}. ID:${c.animal.id} | ${c.animal.name} — ${c.animal.species} ${c.animal.breed} | ` +
        `${c.currentWeight}kg | ECC ${c.animal.bodyConditionScore}/5 | ` +
        `${c.animal.pregnancyHistory} prenhezes | ${c.animal.abortionCount} aborto(s) | ` +
        `${days > 0 ? `${days} dias pós-parto` : 'sem parto anterior'} | ` +
        `Status: ${c.animal.reproductiveStatus}`
      );
    }).join('\n');

    const insightInstruction =
      profile.id === 'brief'
        ? `"aiInsight": "<1 frase: qual candidata tem o perfil mais sólido — cite o dado que justifica>"`
        : profile.id === 'expert'
          ? `"aiInsight": "<4-5 frases: compare os perfis clínicos reais, destaque riscos individuais e recomende manejo pré/pós-inseminação específico para esta espécie no semiárido>"`
          : `"aiInsight": "<2-3 frases citando dados específicos das melhores candidatas>"`;

    const factorsCount = profile.id === 'brief' ? 2 : profile.id === 'expert' ? 5 : 3;
    const baseTokens = profile.id === 'brief' ? 300 : profile.id === 'expert' ? 500 : 400;
    const maxTokens = Math.min(baseTokens + candidates.length * 80, profile.id === 'expert' ? 1500 : 1000);

    const prompt =
      `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
      `Contexto: protocolo ${dto.protocol ?? 'não informado'}` +
      `${dto.ambientTemperature ? ` | temperatura ${dto.ambientTemperature}°C` : ''}` +
      `${dto.season ? ` | estação ${dto.season}` : ''}\n\n` +
      `Candidatas para inseminação:\n${candidateList}\n\n` +
      `REGRA: cada score deve ser justificável pelos dados clínicos. Não use orientações genéricas.\n\n` +
      `Retorne EXATAMENTE este JSON (sem markdown):\n` +
      `{\n` +
      `  "ranking": [{ "animalId": "<ID exato>", "pregnancyProbability": <35-95>, "fertilityScore": <0-100>, "riskLevel": <"low"|"moderate"|"high">, "positiveFactors": [<até ${factorsCount}>], "alerts": [<até ${factorsCount}>] }],\n` +
      `  "recommendations": [<até ${profile.id === 'expert' ? 5 : 3} recomendações para o lote>],\n` +
      `  ${insightInstruction}\n` +
      `}`;

    const start = Date.now();
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
        temperature: profile.temperature,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed.ranking) || parsed.ranking.length === 0) return null;

      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      this.logger.log(`bestDamWithAI — ${inputTokens} in / ${outputTokens} out — ${Date.now() - start}ms`);

      return {
        ranking: parsed.ranking
          .filter((r: any) => typeof r.animalId === 'string' && typeof r.pregnancyProbability === 'number')
          .map((r: any) => ({
            animalId: r.animalId,
            pregnancyProbability: Math.max(35, Math.min(95, Math.round(r.pregnancyProbability))),
            fertilityScore: Math.max(0, Math.min(100, Math.round(r.fertilityScore ?? 50))),
            riskLevel: (['low', 'moderate', 'high'].includes(r.riskLevel) ? r.riskLevel : 'moderate') as 'low' | 'moderate' | 'high',
            positiveFactors: Array.isArray(r.positiveFactors) ? r.positiveFactors : [],
            alerts: Array.isArray(r.alerts) ? r.alerts : [],
          })),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        aiInsight: typeof parsed.aiInsight === 'string' ? parsed.aiInsight.trim() : '',
        tokens: { input: inputTokens, output: outputTokens },
      };
    } catch (err) {
      this.logger.error(`bestDamWithAI — fallback ao algoritmo — ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  generateLocal(animal: Animal, currentWeight: number, score: ScoreOutput): string {
    const parts: string[] = [];
    parts.push(`Probabilidade de prenhez: ${score.pregnancyProbability}% — risco ${score.riskLevel}.`);
    if (score.positiveFactors.length > 0) parts.push(`Destaque positivo: ${score.positiveFactors[0].toLowerCase()}.`);
    if (score.alerts.length > 0) parts.push(`Atenção: ${score.alerts[0].toLowerCase()}.`);
    else parts.push('Nenhum alerta identificado nos fatores avaliados.');
    parts.push(score.recommendations[0] ?? 'Monitorar prenhez em 30 dias.');
    return parts.join(' ');
  }

  async generateForPrediction(
    animal: Animal,
    currentWeight: number,
    score: ScoreOutput,
    sire: Animal | null,
    dto: PredictPregnancyDto,
    profile: AiProfileConfig,
  ): Promise<InsightResult> {
    if (!this.openai) {
      return { text: this.generateLocal(animal, currentWeight, score), tokens: { input: 0, output: 0 } };
    }

    const prompt =
      profile.id === 'expert'
        ? this.buildExpertPrompt(animal, currentWeight, score, sire, dto)
        : profile.id === 'brief'
          ? this.buildBriefPrompt(animal, currentWeight, score)
          : this.buildStandardPrompt(animal, currentWeight, score, sire, dto);

    return this.callOpenAI(prompt, profile, () => this.generateLocal(animal, currentWeight, score));
  }

  async generateForRecommendBreeder(
    animal: Animal,
    currentWeight: number,
    ranking: Array<{ animal: Animal; compatibility: number; classification: string }>,
    profile: AiProfileConfig,
  ): Promise<InsightResult> {
    const best = ranking[0];
    const fallback = `Reprodutor recomendado: ${best.animal.name} (${best.animal.breed}, compatibilidade ${best.compatibility}/100).`;

    if (!this.openai) return { text: fallback, tokens: { input: 0, output: 0 } };

    let prompt: string;
    if (profile.id === 'expert') {
      const top3 = ranking.slice(0, 3);
      const daysPostpartum = calcDaysPostpartum(animal.lastBirthDate);
      prompt =
        `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
        `Fêmea para inseminação:\n` +
        `• ${animal.species} ${animal.breed} | ${currentWeight}kg | ECC ${animal.bodyConditionScore}/5\n` +
        `• ${animal.pregnancyHistory} prenhezes, ${animal.abortionCount} aborto(s)` +
        `${animal.reproductiveDiseaseHistory ? ', histórico de doença reprodutiva' : ''}\n` +
        `• Pós-parto: ${daysPostpartum > 0 ? `${daysPostpartum} dias` : 'sem parto anterior'}\n\n` +
        `Reprodutores disponíveis:\n` +
        top3.map((r, i) =>
          `${i + 1}. ${r.animal.name} — ${r.animal.breed} | ` +
          `${r.animal.pregnanciesAsBreeder} prenhezes confirmadas em ${r.animal.totalInseminations} inseminações`,
        ).join('\n') + '\n\n' +
        `REGRA: cada afirmação deve citar dados reais dos reprodutores ou da fêmea — sem generalidades.\n\n` +
        `Em 3-4 frases técnicas:\n` +
        `(1) Qual reprodutor indicaria e por quê — cite o histórico real de prenhezes e a complementaridade de raça.\n` +
        `(2) Alguma ressalva sobre a fêmea (ECC ${animal.bodyConditionScore}/5, ${animal.abortionCount} aborto(s), ${daysPostpartum > 0 ? `${daysPostpartum} dias pós-parto` : 'sem parto anterior'}) que pode influenciar o resultado independente do reprodutor?\n` +
        `(3) Cuidado concreto de manejo após a inseminação para esta espécie no semiárido.`;
    } else if (profile.id === 'brief') {
      const top2 = ranking.slice(0, 2);
      prompt =
        `${animal.species} ${animal.breed}, ${currentWeight}kg, ECC ${animal.bodyConditionScore}/5. ` +
        `Reprodutores: ` +
        top2.map((r) => `${r.animal.name} (${r.animal.breed}, ${r.animal.pregnanciesAsBreeder}/${r.animal.totalInseminations} prenhezes)`).join(' vs ') +
        `. 1 frase direta: qual você escolheria para essa fêmea e por quê.`;
    } else {
      const top3 = ranking.slice(0, 3);
      prompt =
        `Técnico rural, sertão nordestino. Fêmea ${animal.species} ${animal.breed}, ${currentWeight}kg, ECC ${animal.bodyConditionScore}/5. ` +
        `Reprodutores disponíveis: ${top3.map((r) => `${r.animal.name} (${r.animal.breed}, ${r.animal.pregnanciesAsBreeder} prenhezes em ${r.animal.totalInseminations} inseminações)`).join('; ')}. ` +
        `Em 1-2 frases práticas: qual indicaria e o que observar após a cobertura.`;
    }

    return this.callOpenAI(prompt, profile, () => fallback);
  }

  async generateForBestDam(
    topAnimals: Array<{ animal: AnimalWithFarm; currentWeight: number; result: ScoreOutput }>,
    farm: Farm,
    dto: BestDamDto,
    profile: AiProfileConfig,
  ): Promise<InsightResult> {
    const top3 = topAnimals.slice(0, Math.min(3, topAnimals.length));
    const fallback =
      `Top ${top3.length} matrizes: ` +
      top3.map((p, i) => `${i + 1}º ${p.animal.name} (${p.result.pregnancyProbability}%)`).join('; ') + '.';

    if (!this.openai) return { text: fallback, tokens: { input: 0, output: 0 } };

    let prompt: string;
    if (profile.id === 'expert') {
      prompt =
        `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
        `Contexto do rebanho — Fazenda ${farm.name}` +
        `${dto.species ? ` | Espécie: ${dto.species}` : ''}` +
        `${dto.protocol ? ` | Protocolo planejado: ${dto.protocol}` : ''}` +
        `${dto.ambientTemperature ? ` | Temperatura ambiente: ${dto.ambientTemperature}°C` : ''}` +
        `${dto.season ? ` | Estação: ${dto.season}` : ''}\n\n` +
        `Melhores candidatas para inseminação agora:\n` +
        top3.map((p, i) =>
          `${i + 1}. ${p.animal.name} — ${p.animal.species} ${p.animal.breed} | ${p.currentWeight}kg | ECC ${p.animal.bodyConditionScore}/5 | ` +
          `${p.animal.pregnancyHistory} prenhezes anteriores | ${p.animal.abortionCount} aborto(s) | ` +
          `Status atual: ${p.animal.reproductiveStatus} | Score modelo: ${p.result.pregnancyProbability}%`
        ).join('\n') + '\n\n' +
        `REGRA OBRIGATÓRIA: cada frase deve citar ao menos um valor específico dos dados acima — não escreva nada que valeria para qualquer rebanho.\n\n` +
        `Parecer em 3-4 frases:\n` +
        `(1) Comparando os dados clínicos reais (ECC, histórico de abortos, pós-parto, peso) — não o score — qual animal tem o perfil mais sólido e qual apresenta maior risco? Cite os valores.\n` +
        `(2) Algum dado se destaca negativamente e exige uma ação antes de inseminar? Seja específico.\n` +
        `(3) Recomendação concreta de manejo pré ou pós-inseminação para esta espécie nesta estação no semiárido.`;
    } else if (profile.id === 'brief') {
      prompt =
        `Rebanho semiárido${dto.ambientTemperature ? `, ${dto.ambientTemperature}°C` : ''}. ` +
        `Candidatas: ` +
        top3.map((p) => `${p.animal.name} (${p.animal.species} ${p.animal.breed}, ${p.currentWeight}kg, ECC ${p.animal.bodyConditionScore}/5, ${p.animal.pregnancyHistory} prenhezes, ${p.animal.abortionCount} abortos)`).join('; ') +
        `.\n\nREGRA: cite dados reais. 1 frase: qual tem o perfil mais sólido e por que os dados justificam essa escolha.`;
    } else {
      prompt =
        `Técnico rural, sertão nordestino${dto.ambientTemperature ? `, ${dto.ambientTemperature}°C` : ''}. ` +
        `Candidatas para inseminação: ` +
        top3.map((p) => `${p.animal.name} ${p.animal.species} ${p.animal.breed} (${p.currentWeight}kg, ECC ${p.animal.bodyConditionScore}/5, ${p.animal.pregnancyHistory} prenhezes, ${p.animal.abortionCount} abortos)`).join('; ') +
        `.\n\nREGRA: cite valores específicos. Em 1-2 frases: qual priorizar com base nos dados reais, e um cuidado concreto de manejo para esta época.`;
    }

    return this.callOpenAI(prompt, profile, () => fallback);
  }

  // ─── Prompt builders ──────────────────────────────────────────────────────

  private buildBriefPrompt(animal: Animal, currentWeight: number, score: ScoreOutput): string {
    const daysPostpartum = calcDaysPostpartum(animal.lastBirthDate);
    return (
      `${animal.species} ${animal.breed}, ${currentWeight}kg, ECC ${animal.bodyConditionScore}/5, ` +
      `${animal.pregnancyHistory} prenhezes, ${animal.abortionCount} aborto(s), ` +
      `${daysPostpartum > 0 ? `${daysPostpartum} dias pós-parto` : 'sem parto anterior'}. ` +
      `Probabilidade calculada: ${score.pregnancyProbability}%.\n\n` +
      `Em 1 frase: cite um dado específico deste animal acima (ECC, dias pós-parto, histórico de abortos, peso, raça) ` +
      `e diga o que ele implica concretamente para esta inseminação. Não escreva orientação genérica.`
    );
  }

  private buildStandardPrompt(
    animal: Animal,
    currentWeight: number,
    score: ScoreOutput,
    sire: Animal | null,
    dto: PredictPregnancyDto,
  ): string {
    const daysPostpartum = calcDaysPostpartum(animal.lastBirthDate);
    const sireText = sire
      ? `${sire.name} (${sire.breed}, ${sire.pregnanciesAsBreeder} prenhezes em ${sire.totalInseminations} inseminações)`
      : 'não informado';
    return (
      `Você é técnico em reprodução animal no sertão nordestino.\n\n` +
      `Animal: ${animal.species} ${animal.breed} | ${currentWeight}kg | ECC ${animal.bodyConditionScore}/5\n` +
      `Histórico: ${animal.pregnancyHistory} prenhezes, ${animal.abortionCount} aborto(s)` +
      `${animal.reproductiveDiseaseHistory ? ', histórico de doença reprodutiva' : ''}\n` +
      `Pós-parto: ${daysPostpartum > 0 ? `${daysPostpartum} dias` : 'sem parto anterior'}\n` +
      `Protocolo: ${dto.protocol ?? 'não informado'} | Reprodutor: ${sireText}\n` +
      `Temperatura: ${dto.ambientTemperature ? `${dto.ambientTemperature}°C` : 'não informada'} | Estação: ${dto.season ?? 'não informada'}\n` +
      `Probabilidade calculada: ${score.pregnancyProbability}%\n\n` +
      `REGRA: cite valores específicos dos dados acima — não escreva nada que valeria para qualquer animal.\n\n` +
      `Em 2 frases diretas:\n` +
      `(1) Dos dados acima, quais dois fatores são mais determinantes para o resultado desta inseminação? Justifique com os valores.\n` +
      `(2) O que este perfil específico tem que um número não captura — algo que um veterinário presente notaria neste animal?`
    );
  }

  private buildExpertPrompt(
    animal: Animal,
    currentWeight: number,
    score: ScoreOutput,
    sire: Animal | null,
    dto: PredictPregnancyDto,
  ): string {
    const daysPostpartum = calcDaysPostpartum(animal.lastBirthDate);
    const sireText = sire
      ? `${sire.name}, raça ${sire.breed} (${sire.pregnanciesAsBreeder} prenhezes confirmadas em ${sire.totalInseminations} inseminações)`
      : 'não informado';

    return (
      `Você é veterinário especialista em reprodução animal no semiárido nordestino brasileiro.\n\n` +
      `Dados clínicos:\n` +
      `• Espécie/Raça: ${animal.species} ${animal.breed}\n` +
      `• Peso: ${currentWeight} kg | ECC: ${animal.bodyConditionScore}/5\n` +
      `• Histórico: ${animal.pregnancyHistory} prenhezes, ${animal.abortionCount} aborto(s)` +
      `${animal.reproductiveDiseaseHistory ? ', histórico de doença reprodutiva' : ''}\n` +
      `• Pós-parto: ${daysPostpartum > 0 ? `${daysPostpartum} dias` : 'sem parto anterior registrado'}\n` +
      `• Status atual: ${animal.reproductiveStatus}\n` +
      `• Protocolo: ${dto.protocol ?? 'não informado'} | Reprodutor: ${sireText}\n` +
      `• Temperatura: ${dto.ambientTemperature ? `${dto.ambientTemperature}°C` : 'não informada'} | Estação: ${dto.season ?? 'não informada'}\n` +
      `• Probabilidade calculada pelo modelo: ${score.pregnancyProbability}% (risco ${score.riskLevel})\n\n` +
      `REGRA OBRIGATÓRIA: cada frase deve citar ao menos um valor específico dos dados acima. ` +
      `Não escreva orientações que valeriam para qualquer fêmea.\n\n` +
      `Parecer em 3-4 frases respondendo:\n` +
      `(1) O que nos dados clínicos mais favorece ou mais preocupa este caso — cite o valor que sustenta sua afirmação.\n` +
      `(2) O que este perfil específico tem que um score numérico não captura — algo que um veterinário presente notaria neste animal além dos números?\n` +
      `(3) Recomendação concreta de manejo para esta raça/espécie nesta estação no semiárido — algo além do protocolo padrão.\n` +
      `Linguagem técnica, acessível ao produtor rural.`
    );
  }

  // ─── OpenAI call with fallback ────────────────────────────────────────────

  private async callOpenAI(
    prompt: string,
    profile: AiProfileConfig,
    fallback: () => string,
  ): Promise<InsightResult> {
    const start = Date.now();
    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: profile.maxOutputTokens,
        temperature: profile.temperature,
      });
      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      this.logger.log(`insight [${profile.id}] — ${inputTokens} in / ${outputTokens} out — ${Date.now() - start}ms`);
      return {
        text: response.choices[0]?.message?.content?.trim() ?? '',
        tokens: { input: inputTokens, output: outputTokens },
      };
    } catch (err) {
      this.logger.error(`insight [${profile.id}] — fallback local — ${err instanceof Error ? err.message : err}`);
      return { text: fallback(), tokens: { input: 0, output: 0 } };
    }
  }
}
