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
        `Em 3-4 frases técnicas: (1) qual reprodutor você indicaria para essa fêmea e por quê — considerando histórico real de prenhezes, ` +
        `complementaridade de raça e adaptação ao semiárido, (2) alguma ressalva sobre a fêmea que pode influenciar o resultado, ` +
        `(3) cuidado específico de manejo após a inseminação neste contexto.`;
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
        `Em 3-4 frases técnicas: (1) olhando para os dados clínicos — não apenas para o score — qual animal apresenta o perfil mais sólido e por quê, ` +
        `(2) algum dado chama atenção negativamente (histórico de abortos, baixo ECC, status) e exige cuidado extra, ` +
        `(3) recomendações de manejo pré e pós-inseminação considerando a estação e o clima do semiárido.`;
    } else if (profile.id === 'brief') {
      prompt =
        `Rebanho semiárido${dto.ambientTemperature ? `, ${dto.ambientTemperature}°C` : ''}. ` +
        `Candidatas para inseminação: ` +
        top3.map((p) => `${p.animal.name} (${p.animal.species} ${p.animal.breed}, ${p.currentWeight}kg, ECC ${p.animal.bodyConditionScore}/5, ${p.animal.pregnancyHistory} prenhezes)`).join('; ') +
        `. 1 frase: qual priorizar e por quê.`;
    } else {
      prompt =
        `Técnico rural, sertão nordestino${dto.ambientTemperature ? `, ${dto.ambientTemperature}°C` : ''}. ` +
        `Melhores fêmeas para inseminar: ` +
        top3.map((p) => `${p.animal.name} ${p.animal.species} ${p.animal.breed} (${p.currentWeight}kg, ECC ${p.animal.bodyConditionScore}/5, ${p.animal.pregnancyHistory} prenhezes, ${p.animal.abortionCount} abortos)`).join('; ') +
        `. Em 1-2 frases: qual priorizar, e algum cuidado específico de manejo para esta época.`;
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
      `Probabilidade de prenhez calculada: ${score.pregnancyProbability}%. ` +
      `Em 1 frase curta e direta: o que o produtor deve observar ou fazer neste animal hoje.`
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
      `Temperatura ambiente: ${dto.ambientTemperature ? `${dto.ambientTemperature}°C` : 'não informada'} | Estação: ${dto.season ?? 'não informada'}\n` +
      `Probabilidade de prenhez calculada: ${score.pregnancyProbability}%\n\n` +
      `Em 1-2 frases práticas: (1) o que verificar neste animal nas próximas 48h, ` +
      `(2) existe algum sinal clínico que justificaria postergar a inseminação?`
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
      `Dados clínicos do animal:\n` +
      `• Espécie/Raça: ${animal.species} ${animal.breed}\n` +
      `• Peso: ${currentWeight} kg | ECC: ${animal.bodyConditionScore}/5\n` +
      `• Histórico reprodutivo: ${animal.pregnancyHistory} prenhezes, ${animal.abortionCount} aborto(s)` +
      `${animal.reproductiveDiseaseHistory ? ', histórico de doença reprodutiva' : ''}\n` +
      `• Dias pós-parto: ${daysPostpartum > 0 ? daysPostpartum : 'sem parto anterior registrado'}\n` +
      `• Status reprodutivo atual: ${animal.reproductiveStatus}\n` +
      `• Protocolo: ${dto.protocol ?? 'não informado'} | Reprodutor: ${sireText}\n` +
      `• Temperatura ambiente: ${dto.ambientTemperature ? `${dto.ambientTemperature}°C` : 'não informada'} | Estação: ${dto.season ?? 'não informada'}\n\n` +
      `O modelo preditivo calculou ${score.pregnancyProbability}% de probabilidade de prenhez (risco ${score.riskLevel}).\n\n` +
      `Elabore um parecer técnico em 3-4 frases abordando:\n` +
      `(1) sua avaliação clínica independente — o que os dados sugerem além do score numérico,\n` +
      `(2) manejo específico recomendado para essa raça nesta estação no semiárido,\n` +
      `(3) sinais de alarme que justificariam postergar a inseminação,\n` +
      `(4) ação prioritária nas próximas 48h.\n` +
      `Linguagem técnica, acessível ao produtor rural, sem repetir os números que ele já vê na tela.`
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
