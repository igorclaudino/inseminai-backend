import { Injectable } from '@nestjs/common';
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

type AnimalWithFarm = Animal & { farm: Farm };

@Injectable()
export class AiInsightsService {
  private openai: OpenAI | null;

  constructor() {
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
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
      prompt =
        `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
        `Fêmea para inseminação: ${animal.species} ${animal.breed}, ${currentWeight}kg, ECC ${animal.bodyConditionScore}/5, ` +
        `${animal.pregnancyHistory} prenhezes anteriores, ${animal.abortionCount} aborto(s).\n\n` +
        `Reprodutores disponíveis (por compatibilidade):\n` +
        top3.map((r, i) =>
          `${i + 1}. ${r.animal.name} — ${r.animal.breed} | Score fertilidade: ${r.animal.fertilityScore}/100 | ` +
          `Compatibilidade calculada: ${r.compatibility}/100 | ` +
          `Histórico: ${r.animal.pregnanciesAsBreeder} prenhezes em ${r.animal.totalInseminations} inseminações | ${r.classification}`,
        ).join('\n') + '\n\n' +
        `Em 3-4 frases técnicas: (1) justifique a recomendação do 1º colocado, (2) compare com a alternativa, ` +
        `(3) mencione critérios genéticos e de adaptação ao semiárido nordestino.`;
    } else if (profile.id === 'brief') {
      const top2 = ranking.slice(0, 2);
      prompt =
        `${animal.species} ${animal.breed} fêmea. Reprodutores: ` +
        top2.map((r) => `${r.animal.name} (${r.animal.breed}, compatibilidade ${r.compatibility}/100)`).join(', ') +
        `. 1 frase direta recomendando o melhor.`;
    } else {
      const top3 = ranking.slice(0, 3);
      prompt =
        `Técnico rural, sertão nordestino. Fêmea ${animal.species} ${animal.breed}, ${currentWeight}kg. ` +
        `Reprodutores rankeados: ${top3.map((r) => `${r.animal.name} ${r.animal.breed} (compatibilidade ${r.compatibility}/100)`).join(', ')}. ` +
        `Recomende o melhor em 1-2 frases práticas.`;
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
        `Análise de rebanho — Fazenda ${farm.name}` +
        `${dto.species ? ` | Espécie: ${dto.species}` : ''}` +
        `${dto.protocol ? ` | Protocolo: ${dto.protocol}` : ''}` +
        `${dto.ambientTemperature ? ` | Temperatura: ${dto.ambientTemperature}°C` : ''}` +
        `${dto.season ? ` | Estação: ${dto.season}` : ''}\n\n` +
        `Top ${top3.length} matrizes para inseminação agora:\n` +
        top3.map((p, i) =>
          `${i + 1}. ${p.animal.name} — ${p.animal.species} ${p.animal.breed} | ${p.currentWeight}kg | ECC ${p.animal.bodyConditionScore}/5 | ` +
          `${p.animal.pregnancyHistory} prenhezes | ${p.animal.abortionCount} abortos | ` +
          `Status: ${p.animal.reproductiveStatus} | Probabilidade: ${p.result.pregnancyProbability}% | Risco: ${p.result.riskLevel}`
        ).join('\n') + '\n\n' +
        `Em 3-4 frases técnicas: (1) por que essas fêmeas são as melhores candidatas agora, ` +
        `(2) padrões comuns de condição entre elas, (3) recomendações de prioridade e manejo para o técnico no semiárido.`;
    } else if (profile.id === 'brief') {
      prompt =
        `Rebanho semiárido. Top 3 fêmeas para inseminação: ` +
        top3.map((p) => `${p.animal.name} (${p.animal.species}, ${p.result.pregnancyProbability}%)`).join(', ') +
        `. 1 frase de orientação prática.`;
    } else {
      prompt =
        `Técnico rural, sertão nordestino. Melhores fêmeas para inseminar agora: ` +
        top3.map((p) => `${p.animal.name} ${p.animal.species} ${p.animal.breed} (${p.result.pregnancyProbability}%, risco ${p.result.riskLevel})`).join('; ') +
        `. Principais alertas: ${topAnimals.flatMap((p) => p.result.alerts).slice(0, 3).join('; ') || 'nenhum'}. ` +
        `Oriente em 1-2 frases o técnico sobre prioridade e cuidados.`;
    }

    return this.callOpenAI(prompt, profile, () => fallback);
  }

  // ─── Prompt builders ──────────────────────────────────────────────────────

  private buildBriefPrompt(animal: Animal, currentWeight: number, score: ScoreOutput): string {
    const alert = score.alerts[0] ?? null;
    return (
      `${animal.species} ${animal.breed}, ${currentWeight}kg. ` +
      `Prenhez: ${score.pregnancyProbability}%, risco ${score.riskLevel}. ` +
      `${alert ? `Alerta: ${alert}.` : 'Sem alertas.'} ` +
      `1 frase prática e direta para o produtor.`
    );
  }

  private buildStandardPrompt(
    animal: Animal,
    currentWeight: number,
    score: ScoreOutput,
    sire: Animal | null,
    dto: PredictPregnancyDto,
  ): string {
    const alertsText = score.alerts.length ? score.alerts.join('; ') : 'nenhum';
    const sireText = sire ? `${sire.name} (score ${sire.fertilityScore}/100)` : 'não informado';
    return (
      `Técnico rural, sertão nordestino. ` +
      `${animal.species} ${animal.breed}, ${currentWeight}kg, ${animal.pregnancyHistory} prenhezes anteriores, ` +
      `${animal.abortionCount} aborto(s), protocolo: ${dto.protocol ?? 'não informado'}, ` +
      `reprodutor: ${sireText}. ` +
      `Resultado: ${score.pregnancyProbability}% de prenhez, risco ${score.riskLevel}. ` +
      `Alertas: ${alertsText}. ` +
      `Escreva 1-2 frases práticas e diretas.`
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
      ? `${sire.name}, raça ${sire.breed}, score ${sire.fertilityScore}/100 (${sire.pregnanciesAsBreeder} prenhezes em ${sire.totalInseminations} inseminações)`
      : 'não informado';

    return (
      `Você é veterinário especialista em reprodução animal no semiárido nordestino brasileiro.\n\n` +
      `Caso para análise:\n` +
      `• Animal: ${animal.species} ${animal.breed} | Peso: ${currentWeight} kg | ECC: ${animal.bodyConditionScore}/5\n` +
      `• Histórico: ${animal.pregnancyHistory} prenhezes, ${animal.abortionCount} aborto(s)` +
      `${animal.reproductiveDiseaseHistory ? ', com histórico de doença reprodutiva' : ''}\n` +
      `• Pós-parto: ${daysPostpartum > 0 ? daysPostpartum + ' dias' : 'sem parto anterior registrado'}\n` +
      `• Protocolo: ${dto.protocol ?? 'não informado'} | Reprodutor: ${sireText}\n` +
      `• Condições: Temperatura ${dto.ambientTemperature ? `${dto.ambientTemperature}°C` : 'não informada'} | Estação: ${dto.season ?? 'não informada'}\n\n` +
      `Resultado do modelo de scoring:\n` +
      `• Probabilidade de prenhez: ${score.pregnancyProbability}% | Risco: ${score.riskLevel}\n` +
      `• Score zootécnico: ${score.fertilityScore}/100\n` +
      `• Fatores favoráveis: ${score.positiveFactors.join('; ') || 'nenhum'}\n` +
      `• Alertas: ${score.alerts.join('; ') || 'nenhum'}\n\n` +
      `Elabore um laudo técnico em 3-4 frases abordando: ` +
      `(1) avaliação geral do animal, ` +
      `(2) principais riscos ou pontos favoráveis para a inseminação, ` +
      `(3) recomendações práticas de manejo específicas para o semiárido nordestino. ` +
      `Linguagem técnica mas acessível ao produtor rural.`
    );
  }

  // ─── OpenAI call with fallback ────────────────────────────────────────────

  private async callOpenAI(
    prompt: string,
    profile: AiProfileConfig,
    fallback: () => string,
  ): Promise<InsightResult> {
    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: profile.maxOutputTokens,
        temperature: profile.temperature,
      });
      return {
        text: response.choices[0]?.message?.content?.trim() ?? '',
        tokens: {
          input: response.usage?.prompt_tokens ?? 0,
          output: response.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      console.error('[AiInsights] OpenAI error:', err instanceof Error ? err.message : err);
      return { text: fallback(), tokens: { input: 0, output: 0 } };
    }
  }
}
