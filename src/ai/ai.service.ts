import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { PredictPregnancyDto } from './dto/predict-pregnancy.dto';
import { UpdateAiProfileDto } from './dto/update-ai-profile.dto';
import { BestDamDto } from './dto/best-dam.dto';
import { calcDaysPostpartum } from '../common/helpers/days-postpartum';
import { AI_PROFILES, VALID_AI_PROFILES, AiProfileConfig } from './ai-profile.constants';

export interface PredictionResult {
  pregnancyProbability: number;
  fertilityScore: number;
  riskLevel: string;
  geneticCompatibility: number | null;
  positiveFactors: string[];
  alerts: string[];
  recommendations: string[];
  aiInsight?: string;
  protocol?: string;
  _meta?: {
    aiProfile: string;
    aiProfileName: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  listProfiles() {
    return Object.values(AI_PROFILES).map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      summary: p.summary,
      description: p.description,
      estimatedLatency: p.estimatedLatency,
      estimatedTokensPerAnalysis: p.estimatedInputTokens + p.estimatedOutputTokens,
      estimatedCostPer1000Analyses: {
        usd: p.costUsdPer1000,
        brl: +(p.costUsdPer1000 * 5.7).toFixed(2),
      },
    }));
  }

  async getAiConfig(farmId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });

    const profile = AI_PROFILES[farm.aiProfile] ?? AI_PROFILES.standard;
    return {
      farmId: farm.id,
      farmName: farm.name,
      currentProfile: {
        id: profile.id,
        name: profile.name,
        icon: profile.icon,
        summary: profile.summary,
        description: profile.description,
      },
      availableProfiles: this.listProfiles(),
    };
  }

  async updateAiConfig(farmId: string, dto: UpdateAiProfileDto) {
    if (!VALID_AI_PROFILES.includes(dto.aiProfile)) {
      throw new BadRequestException(`Invalid profile. Valid values: ${VALID_AI_PROFILES.join(', ')}`);
    }

    const updated = await this.prisma.farm.update({
      where: { id: farmId },
      data: { aiProfile: dto.aiProfile },
    });

    const profile = AI_PROFILES[dto.aiProfile];
    return {
      message: `Profile updated to "${profile.name}" successfully.`,
      farmId: updated.id,
      currentProfile: {
        id: profile.id,
        name: profile.name,
        icon: profile.icon,
        summary: profile.summary,
      },
    };
  }

  async predictPregnancy(dto: PredictPregnancyDto, farmId: string): Promise<PredictionResult> {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      include: {
        farm: true,
        weighings: { orderBy: { weighingDate: 'desc' }, take: 1 },
      },
    });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    let breeder = null;
    if (dto.breederId) {
      breeder = await this.prisma.breeder.findUnique({ where: { id: dto.breederId } });
    }

    const currentWeight = animal.weighings[0]?.weightKg ?? 0;
    const result = this.calculateScore(animal, currentWeight, breeder, dto);

    const profileId = animal.farm.aiProfile ?? 'standard';
    const profile: AiProfileConfig = AI_PROFILES[profileId] ?? AI_PROFILES.standard;

    let inputTokens = 0;
    let outputTokens = 0;

    if (!profile.callsAi) {
      result.aiInsight = this.generateLocalInsight(animal, currentWeight, result);
    } else {
      const { text, tokens } = await this.generateOpenAIInsight(animal, currentWeight, result, breeder, dto, profile);
      result.aiInsight = text;
      inputTokens = tokens.input;
      outputTokens = tokens.output;
    }

    result._meta = {
      aiProfile: profile.id,
      aiProfileName: profile.name,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    };

    await this.prisma.prediction.create({
      data: {
        animalId: dto.animalId,
        pregnancyProbability: result.pregnancyProbability,
        fertilityScore: result.fertilityScore,
        riskLevel: result.riskLevel,
        geneticCompatibility: result.geneticCompatibility,
        positiveFactors: result.positiveFactors,
        alerts: result.alerts,
        recommendations: result.recommendations,
        aiInsight: result.aiInsight,
        protocol: dto.protocol,
        ambientTemperature: dto.ambientTemperature ?? null,
        season: dto.season ?? null,
        aiProfile: profile.id,
        inputTokens,
        outputTokens,
        analysisType: 'pregnancy',
        ...(dto.breederId && { breederId: dto.breederId }),
        ...(dto.reproductiveEventId && { reproductiveEventId: dto.reproductiveEventId }),
      },
    });

    return result;
  }

  async consumptionReport(farmId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });

    const predictions = await this.prisma.prediction.findMany({
      where: { animal: { farmId } },
      select: {
        aiProfile: true,
        inputTokens: true,
        outputTokens: true,
        createdAt: true,
      },
    });

    const totalAnalyses = predictions.length;

    const byProfile: Record<string, { count: number; inputTokens: number; outputTokens: number }> = {
      essential: { count: 0, inputTokens: 0, outputTokens: 0 },
      brief:     { count: 0, inputTokens: 0, outputTokens: 0 },
      standard:  { count: 0, inputTokens: 0, outputTokens: 0 },
      expert:    { count: 0, inputTokens: 0, outputTokens: 0 },
    };

    for (const p of predictions) {
      const k = VALID_AI_PROFILES.includes(p.aiProfile) ? p.aiProfile : 'standard';
      byProfile[k].count++;
      byProfile[k].inputTokens += p.inputTokens;
      byProfile[k].outputTokens += p.outputTokens;
    }

    const totalInputTokens = predictions.reduce((acc, p) => acc + p.inputTokens, 0);
    const totalOutputTokens = predictions.reduce((acc, p) => acc + p.outputTokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;

    const actualCostUsd = totalInputTokens * 0.00000015 + totalOutputTokens * 0.0000006;

    const hypotheticalExpertCostUsd =
      totalAnalyses * AI_PROFILES.expert.estimatedInputTokens * 0.00000015 +
      totalAnalyses * AI_PROFILES.expert.estimatedOutputTokens * 0.0000006;

    const savingsUsd = Math.max(0, hypotheticalExpertCostUsd - actualCostUsd);

    const profileDetails = VALID_AI_PROFILES.map((id) => {
      const data = byProfile[id];
      const profile = AI_PROFILES[id];
      const totalTk = data.inputTokens + data.outputTokens;
      const avgTokens = data.count > 0 ? Math.round(totalTk / data.count) : 0;
      const profileCost = data.inputTokens * 0.00000015 + data.outputTokens * 0.0000006;

      return {
        profileId: id,
        profileName: profile.name,
        icon: profile.icon,
        summary: profile.summary,
        totalAnalyses: data.count,
        usagePercentage: totalAnalyses > 0 ? +((data.count / totalAnalyses) * 100).toFixed(1) : 0,
        tokens: {
          averageActualPerAnalysis: avgTokens,
          estimatedPerAnalysis: profile.estimatedInputTokens + profile.estimatedOutputTokens,
          totalConsumed: totalTk,
        },
        cost: {
          totalUsd: +profileCost.toFixed(6),
          totalBrl: +(profileCost * 5.7).toFixed(4),
          estimatedPer1000AnalysesBrl: +(profile.costUsdPer1000 * 5.7).toFixed(2),
        },
        estimatedLatency: profile.estimatedLatency,
      };
    });

    const projections = VALID_AI_PROFILES.map((id) => {
      const profile = AI_PROFILES[id];
      const costPer1000Brl = +(profile.costUsdPer1000 * 5.7).toFixed(2);
      return {
        profileId: id,
        profileName: profile.name,
        for100AnalysesBrl: +(profile.costUsdPer1000 * 5.7 * 0.1).toFixed(2),
        for1000AnalysesBrl: costPer1000Brl,
        for10000AnalysesBrl: +(profile.costUsdPer1000 * 5.7 * 10).toFixed(2),
      };
    });

    return {
      farm: { id: farm.id, name: farm.name, currentProfile: farm.aiProfile },
      summary: {
        totalAnalyses,
        totalTokensConsumed: totalTokens,
        actualAccumulatedCost: {
          usd: +actualCostUsd.toFixed(6),
          brl: +(actualCostUsd * 5.7).toFixed(4),
        },
        savingsVsExpertTotal: {
          usd: +savingsUsd.toFixed(6),
          brl: +(savingsUsd * 5.7).toFixed(4),
          percentage:
            hypotheticalExpertCostUsd > 0
              ? +((savingsUsd / hypotheticalExpertCostUsd) * 100).toFixed(1)
              : 0,
        },
      },
      byProfile: profileDetails,
      costProjections: projections,
      _note:
        'Cost calculated based on GPT-4o-mini (US$ 0.150/1M input tokens, US$ 0.600/1M output tokens). ' +
        'Reference exchange rate: R$ 5.70/USD. Approximate values for planning purposes.',
    };
  }

  async recommendBreeder(farmId: string, animalId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });

    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: { weighings: { orderBy: { weighingDate: 'desc' }, take: 1 } },
    });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.sex !== 'female') throw new BadRequestException('Breeder recommendation only applies to females');

    const breeders = await this.prisma.breeder.findMany({
      where: { farmId, species: animal.species, active: true },
      orderBy: { fertilityScore: 'desc' },
    });
    if (!breeders.length) throw new NotFoundException('No active breeders found for this species');

    const currentWeight = animal.weighings[0]?.weightKg ?? 0;

    const ranking = breeders.map((b) => {
      let compatibility = b.fertilityScore;

      if (b.breed.toLowerCase() !== animal.breed.toLowerCase()) compatibility = Math.min(100, compatibility + 5);
      if (b.totalInseminations >= 10) compatibility = Math.min(100, compatibility + 3);
      if (b.fertilityScore < 60) compatibility = Math.max(0, compatibility - 10);

      const classification =
        compatibility >= 85 ? 'Excellent' :
        compatibility >= 70 ? 'Very Good' :
        compatibility >= 55 ? 'Good' : 'Fair';

      return { breeder: b, compatibility, classification };
    });

    ranking.sort((a, b) => b.compatibility - a.compatibility);
    const top = ranking.slice(0, 5);

    const profileId = farm.aiProfile ?? 'standard';
    const profile: AiProfileConfig = AI_PROFILES[profileId] ?? AI_PROFILES.standard;

    let aiInsight = '';
    let inputTokens = 0;
    let outputTokens = 0;

    if (!profile.callsAi) {
      const best = top[0];
      aiInsight =
        `Reprodutor recomendado: ${best.breeder.name} (${best.breeder.breed}, ` +
        `compatibilidade ${best.compatibility}/100). ` +
        `${top.length > 1 ? `Alternativa: ${top[1].breeder.name} (${top[1].compatibility}/100).` : ''}`;
    } else {
      const { text, tokens } = await this.generateBreederOpenAIInsight(animal, currentWeight, top, profile);
      aiInsight = text;
      inputTokens = tokens.input;
      outputTokens = tokens.output;
    }

    await this.prisma.prediction.create({
      data: {
        animalId,
        breederId: top[0].breeder.id,
        analysisType: 'best_breeder',
        pregnancyProbability: top[0].compatibility,
        fertilityScore: top[0].breeder.fertilityScore,
        riskLevel: top[0].compatibility >= 70 ? 'low' : top[0].compatibility >= 50 ? 'moderate' : 'high',
        geneticCompatibility: top[0].compatibility,
        positiveFactors: top.slice(0, 3).map((r) => `${r.breeder.name} (${r.classification}, score ${r.compatibility})`),
        alerts: top.filter((r) => r.breeder.fertilityScore < 60).map((r) => `${r.breeder.name} with below-ideal fertility`),
        recommendations: top.map((r, i) => `${i + 1}. ${r.breeder.name} — ${r.breeder.breed} | compatibility ${r.compatibility}/100 | ${r.classification}`),
        aiInsight,
        aiProfile: profile.id,
        inputTokens,
        outputTokens,
      },
    });

    return {
      animal: {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        breed: animal.breed,
        currentWeight,
        bodyConditionScore: animal.bodyConditionScore,
      },
      ranking: top.map((item, i) => ({
        position: i + 1,
        breeder: {
          id: item.breeder.id,
          name: item.breeder.name,
          breed: item.breeder.breed,
          fertilityScore: item.breeder.fertilityScore,
          totalInseminations: item.breeder.totalInseminations,
          pregnancies: item.breeder.pregnancies,
          actualPregnancyRate: item.breeder.totalInseminations > 0
            ? Math.round((item.breeder.pregnancies / item.breeder.totalInseminations) * 100)
            : null,
        },
        compatibility: item.compatibility,
        classification: item.classification,
        bestChoice: i === 0,
      })),
      aiInsight,
      _meta: {
        aiProfile: profile.id,
        aiProfileName: profile.name,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  }

  async bestDam(farmId: string, dto: BestDamDto) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });

    const limit = dto.limit ?? 5;

    const females = await this.prisma.animal.findMany({
      where: {
        farmId,
        sex: 'female',
        active: true,
        reproductiveStatus: { notIn: ['Pregnant', 'Inactive', 'Culled'] },
        ...(dto.species && { species: dto.species }),
      },
      include: {
        farm: true,
        weighings: { orderBy: { weighingDate: 'desc' }, take: 1 },
      },
    });

    if (!females.length) throw new NotFoundException('No eligible females found for the given filters');

    const dtoScore: any = {
      protocol: dto.protocol ?? 'FTAI',
      ambientTemperature: dto.ambientTemperature,
      season: dto.season,
    };

    const scored = females.map((animal) => {
      const currentWeight = animal.weighings[0]?.weightKg ?? 0;
      const result = this.calculateScore(animal, currentWeight, null, dtoScore);
      return { animal, currentWeight, result };
    });

    scored.sort((a, b) => b.result.pregnancyProbability - a.result.pregnancyProbability);

    const topAnimals = scored.slice(0, limit);

    const profileId = farm.aiProfile ?? 'standard';
    const profile: AiProfileConfig = AI_PROFILES[profileId] ?? AI_PROFILES.standard;

    let aiInsight = '';
    let inputTokens = 0;
    let outputTokens = 0;

    if (!profile.callsAi) {
      const top3 = topAnimals.slice(0, 3);
      aiInsight =
        `Melhores matrizes para inseminação agora: ` +
        top3.map((p, i) => `${i + 1}º ${p.animal.name} (${p.result.pregnancyProbability}%, risco ${p.result.riskLevel})`).join('; ') + '.';
    } else {
      const { text, tokens } = await this.generateBestDamOpenAIInsight(topAnimals, farm, dto, profile);
      aiInsight = text;
      inputTokens = tokens.input;
      outputTokens = tokens.output;
    }

    const topAnimal = topAnimals[0];
    await this.prisma.prediction.create({
      data: {
        animalId: topAnimal.animal.id,
        analysisType: 'best_dam',
        pregnancyProbability: topAnimal.result.pregnancyProbability,
        fertilityScore: topAnimal.result.fertilityScore,
        riskLevel: topAnimal.result.riskLevel,
        geneticCompatibility: null,
        positiveFactors: topAnimal.result.positiveFactors.slice(0, 3),
        alerts: topAnimal.result.alerts.slice(0, 3),
        recommendations: topAnimals.map(
          (p, i) => `${i + 1}. ${p.animal.name} (${p.animal.species} ${p.animal.breed}) — ${p.result.pregnancyProbability}% | risk ${p.result.riskLevel}`,
        ),
        aiInsight,
        protocol: dto.protocol,
        ambientTemperature: dto.ambientTemperature ?? null,
        season: dto.season ?? null,
        aiProfile: profile.id,
        inputTokens,
        outputTokens,
      },
    });

    return {
      farm: { id: farm.id, name: farm.name },
      parameters: {
        protocol: dto.protocol ?? 'FTAI',
        ambientTemperature: dto.ambientTemperature ?? null,
        season: dto.season ?? null,
        species: dto.species ?? 'all',
      },
      totalAnimalsEvaluated: females.length,
      ranking: topAnimals.map((p, i) => ({
        position: i + 1,
        animal: {
          id: p.animal.id,
          name: p.animal.name,
          identifier: p.animal.identifier,
          species: p.animal.species,
          breed: p.animal.breed,
          reproductiveStatus: p.animal.reproductiveStatus,
          bodyConditionScore: p.animal.bodyConditionScore,
        },
        currentWeight: p.currentWeight,
        pregnancyProbability: p.result.pregnancyProbability,
        fertilityScore: p.result.fertilityScore,
        riskLevel: p.result.riskLevel,
        positiveFactors: p.result.positiveFactors,
        alerts: p.result.alerts,
        bestChoice: i === 0,
      })),
      aiInsight,
      _meta: {
        aiProfile: profile.id,
        aiProfileName: profile.name,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  }

  async predictionHistory(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    return this.prisma.prediction.findMany({
      where: { animalId },
      orderBy: { createdAt: 'desc' },
      include: {
        breeder: { select: { id: true, name: true, breed: true, fertilityScore: true } },
      },
    });
  }

  async farmPredictionHistory(farmId: string, page = 1, limit = 20) {

    const where = { animal: { farmId } };

    const [predictions, total] = await Promise.all([
      this.prisma.prediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          animal: { select: { id: true, name: true, identifier: true, species: true, breed: true } },
          breeder: { select: { id: true, name: true, breed: true, fertilityScore: true } },
        },
      }),
      this.prisma.prediction.count({ where }),
    ]);

    return { data: predictions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private generateLocalInsight(animal: any, currentWeight: number, result: PredictionResult): string {
    const parts: string[] = [];

    parts.push(`Probabilidade de prenhez: ${result.pregnancyProbability}% — risco ${result.riskLevel}.`);

    if (result.positiveFactors.length > 0) {
      parts.push(`Destaque positivo: ${result.positiveFactors[0].toLowerCase()}.`);
    }

    if (result.alerts.length > 0) {
      parts.push(`Atenção: ${result.alerts[0].toLowerCase()}.`);
    } else {
      parts.push('Nenhum alerta identificado nos fatores avaliados.');
    }

    parts.push(result.recommendations[0] ?? 'Monitorar prenhez em 30 dias.');

    return parts.join(' ');
  }

  private async generateOpenAIInsight(
    animal: any,
    currentWeight: number,
    result: PredictionResult,
    breeder: any,
    dto: PredictPregnancyDto,
    profile: AiProfileConfig,
  ): Promise<{ text: string; tokens: { input: number; output: number } }> {
    if (!process.env.OPENAI_API_KEY) {
      return { text: this.generateLocalInsight(animal, currentWeight, result), tokens: { input: 0, output: 0 } };
    }

    const prompt =
      profile.id === 'expert'
        ? this.buildExpertPrompt(animal, currentWeight, result, breeder, dto)
        : profile.id === 'brief'
          ? this.buildBriefPrompt(animal, currentWeight, result)
          : this.buildStandardPrompt(animal, currentWeight, result, breeder, dto);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: profile.maxOutputTokens,
        temperature: profile.temperature,
      });

      const text = response.choices[0]?.message?.content?.trim() ?? '';
      const input = response.usage?.prompt_tokens ?? 0;
      const output = response.usage?.completion_tokens ?? 0;

      return { text, tokens: { input, output } };
    } catch (err) {
      console.error('[AI] OpenAI error:', err instanceof Error ? err.message : err);
      return { text: this.generateLocalInsight(animal, currentWeight, result), tokens: { input: 0, output: 0 } };
    }
  }

  private async generateBreederOpenAIInsight(
    animal: any,
    currentWeight: number,
    ranking: Array<{ breeder: any; compatibility: number; classification: string }>,
    profile: AiProfileConfig,
  ): Promise<{ text: string; tokens: { input: number; output: number } }> {
    if (!process.env.OPENAI_API_KEY) {
      const best = ranking[0];
      return {
        text: `Reprodutor recomendado: ${best.breeder.name} (${best.breeder.breed}, compatibilidade ${best.compatibility}/100).`,
        tokens: { input: 0, output: 0 },
      };
    }

    let prompt: string;

    if (profile.id === 'expert') {
      const top3 = ranking.slice(0, 3);
      prompt =
        `Você é veterinário especialista em reprodução animal no semiárido nordestino.\n\n` +
        `Fêmea para inseminação: ${animal.species} ${animal.breed}, ${currentWeight}kg, ECC ${animal.bodyConditionScore}/5, ` +
        `${animal.pregnancyHistory} prenhezes anteriores, ${animal.abortionCount} aborto(s).\n\n` +
        `Reprodutores disponíveis (por compatibilidade):\n` +
        top3.map((r, i) =>
          `${i + 1}. ${r.breeder.name} — ${r.breeder.breed} | Score fertilidade: ${r.breeder.fertilityScore}/100 | ` +
          `Compatibilidade calculada: ${r.compatibility}/100 | ` +
          `Histórico: ${r.breeder.pregnancies} prenhezes em ${r.breeder.totalInseminations} inseminações | ${r.classification}`
        ).join('\n') + '\n\n' +
        `Em 3-4 frases técnicas: (1) justifique a recomendação do 1º colocado, (2) compare com a alternativa, ` +
        `(3) mencione critérios genéticos e de adaptação ao semiárido nordestino.`;
    } else if (profile.id === 'brief') {
      const top2 = ranking.slice(0, 2);
      prompt =
        `${animal.species} ${animal.breed} fêmea. Reprodutores: ` +
        top2.map((r) => `${r.breeder.name} (${r.breeder.breed}, compatibilidade ${r.compatibility}/100)`).join(', ') +
        `. 1 frase direta recomendando o melhor.`;
    } else {
      const top3 = ranking.slice(0, 3);
      prompt =
        `Técnico rural, sertão nordestino. Fêmea ${animal.species} ${animal.breed}, ${currentWeight}kg. ` +
        `Reprodutores rankeados: ${top3.map((r) => `${r.breeder.name} ${r.breeder.breed} (compatibilidade ${r.compatibility}/100)`).join(', ')}. ` +
        `Recomende o melhor em 1-2 frases práticas.`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: profile.maxOutputTokens,
        temperature: profile.temperature,
      });
      const text = response.choices[0]?.message?.content?.trim() ?? '';
      return { text, tokens: { input: response.usage?.prompt_tokens ?? 0, output: response.usage?.completion_tokens ?? 0 } };
    } catch (err) {
      console.error('[AI] Breeder OpenAI error:', err instanceof Error ? err.message : err);
      return { text: `Recomendação: ${ranking[0].breeder.name} (compatibilidade ${ranking[0].compatibility}/100).`, tokens: { input: 0, output: 0 } };
    }
  }

  private async generateBestDamOpenAIInsight(
    topAnimals: Array<{ animal: any; currentWeight: number; result: any }>,
    farm: any,
    dto: BestDamDto,
    profile: AiProfileConfig,
  ): Promise<{ text: string; tokens: { input: number; output: number } }> {
    if (!process.env.OPENAI_API_KEY) {
      const top3 = topAnimals.slice(0, 3);
      return {
        text: `Top ${top3.length} matrizes: ` + top3.map((p, i) => `${i + 1}º ${p.animal.name} (${p.result.pregnancyProbability}%)`).join('; ') + '.',
        tokens: { input: 0, output: 0 },
      };
    }

    let prompt: string;
    const top3 = topAnimals.slice(0, Math.min(3, topAnimals.length));

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

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: profile.maxOutputTokens,
        temperature: profile.temperature,
      });
      const text = response.choices[0]?.message?.content?.trim() ?? '';
      return { text, tokens: { input: response.usage?.prompt_tokens ?? 0, output: response.usage?.completion_tokens ?? 0 } };
    } catch (err) {
      console.error('[AI] BestDam OpenAI error:', err instanceof Error ? err.message : err);
      return { text: `Top matriz: ${topAnimals[0].animal.name} (${topAnimals[0].result.pregnancyProbability}% de prenhez).`, tokens: { input: 0, output: 0 } };
    }
  }

  private buildBriefPrompt(animal: any, currentWeight: number, result: PredictionResult): string {
    const alert = result.alerts.length ? result.alerts[0] : null;
    return (
      `${animal.species} ${animal.breed}, ${currentWeight}kg. ` +
      `Prenhez: ${result.pregnancyProbability}%, risco ${result.riskLevel}. ` +
      `${alert ? `Alerta: ${alert}.` : 'Sem alertas.'} ` +
      `1 frase prática e direta para o produtor.`
    );
  }

  private buildStandardPrompt(animal: any, currentWeight: number, result: PredictionResult, breeder: any, dto: PredictPregnancyDto): string {
    const alertsText = result.alerts.length ? result.alerts.join('; ') : 'nenhum';
    const breederText = breeder ? `${breeder.name} (score ${breeder.fertilityScore}/100)` : 'não informado';

    return (
      `Técnico rural, sertão nordestino. ` +
      `${animal.species} ${animal.breed}, ${currentWeight}kg, ${animal.pregnancyHistory} prenhezes anteriores, ` +
      `${animal.abortionCount} aborto(s), protocolo: ${dto.protocol ?? 'não informado'}, ` +
      `reprodutor: ${breederText}. ` +
      `Resultado: ${result.pregnancyProbability}% de prenhez, risco ${result.riskLevel}. ` +
      `Alertas: ${alertsText}. ` +
      `Escreva 1-2 frases práticas e diretas.`
    );
  }

  private buildExpertPrompt(animal: any, currentWeight: number, result: PredictionResult, breeder: any, dto: PredictPregnancyDto): string {
    const daysPostpartum = calcDaysPostpartum(animal.lastBirthDate);
    const breederText = breeder
      ? `${breeder.name}, raça ${breeder.breed}, score ${breeder.fertilityScore}/100 (${breeder.pregnancies} prenhezes em ${breeder.totalInseminations} inseminações)`
      : 'não informado';
    const tempText = dto.ambientTemperature ? `${dto.ambientTemperature}°C` : 'não informada';
    const seasonText = dto.season ?? 'não informada';
    const positiveText = result.positiveFactors.join('; ') || 'nenhum';
    const alertsText = result.alerts.join('; ') || 'nenhum';

    return (
      `Você é veterinário especialista em reprodução animal no semiárido nordestino brasileiro.\n\n` +
      `Caso para análise:\n` +
      `• Animal: ${animal.species} ${animal.breed} | Peso: ${currentWeight} kg | ECC: ${animal.bodyConditionScore}/5\n` +
      `• Histórico: ${animal.pregnancyHistory} prenhezes, ${animal.abortionCount} aborto(s)` +
      `${animal.reproductiveDiseaseHistory ? ', com histórico de doença reprodutiva' : ''}\n` +
      `• Pós-parto: ${daysPostpartum > 0 ? daysPostpartum + ' dias' : 'sem parto anterior registrado'}\n` +
      `• Protocolo: ${dto.protocol ?? 'não informado'} | Reprodutor: ${breederText}\n` +
      `• Condições: Temperatura ${tempText} | Estação: ${seasonText}\n\n` +
      `Resultado do modelo de scoring:\n` +
      `• Probabilidade de prenhez: ${result.pregnancyProbability}% | Risco: ${result.riskLevel}\n` +
      `• Score zootécnico: ${result.fertilityScore}/100\n` +
      `• Fatores favoráveis: ${positiveText}\n` +
      `• Alertas: ${alertsText}\n\n` +
      `Elabore um laudo técnico em 3-4 frases abordando: ` +
      `(1) avaliação geral do animal, ` +
      `(2) principais riscos ou pontos favoráveis para a inseminação, ` +
      `(3) recomendações práticas de manejo específicas para o semiárido nordestino. ` +
      `Linguagem técnica mas acessível ao produtor rural.`
    );
  }

  private calculateScore(animal: any, currentWeight: number, breeder: any, dto: any): PredictionResult {
    let score = 0;
    const positiveFactors: string[] = [];
    const alerts: string[] = [];
    const recommendations: string[] = [];

    // Body weight
    const minWeights: Record<string, number> = { cattle: 380, sheep: 45, goat: 35 };
    const minWeight = minWeights[animal.species] ?? 380;
    if (currentWeight >= minWeight) {
      score += 25;
      positiveFactors.push(`Peso adequado (${currentWeight} kg)`);
    } else if (currentWeight > 0) {
      alerts.push(`Peso abaixo do ideal (${currentWeight} kg — mínimo ${minWeight} kg)`);
      recommendations.push('Melhorar suplementação nutricional antes da inseminação');
    }

    // Postpartum period
    const daysPostpartum = calcDaysPostpartum(animal.lastBirthDate);
    if (daysPostpartum === 0 || daysPostpartum >= 60) {
      score += 20;
      if (daysPostpartum >= 60) positiveFactors.push(`Pós-parto adequado (${daysPostpartum} dias)`);
    } else {
      alerts.push(`Pós-parto curto (${daysPostpartum} dias — ideal ≥ 60)`);
      recommendations.push('Aguardar período pós-parto mínimo de 60 dias');
    }

    // Reproductive history
    if (animal.pregnancyHistory > 0) {
      score += 15;
      positiveFactors.push(`Histórico reprodutivo positivo (${animal.pregnancyHistory} prenhezes anteriores)`);
    }

    // Abortion history
    if (animal.abortionCount === 0) {
      score += 10;
      positiveFactors.push('Sem histórico de abortos');
    } else {
      alerts.push(`Histórico de ${animal.abortionCount} aborto(s)`);
    }

    // Body condition score
    if (animal.bodyConditionScore >= 3) {
      score += 10;
      positiveFactors.push(`Boa condição corporal (escore ${animal.bodyConditionScore}/5)`);
    } else {
      alerts.push(`Condição corporal baixa (escore ${animal.bodyConditionScore}/5)`);
      recommendations.push('Melhorar condição corporal antes do protocolo');
    }

    // Reproductive health
    if (!animal.reproductiveDiseaseHistory) {
      score += 10;
      positiveFactors.push('Sem histórico de doenças reprodutivas');
    } else {
      alerts.push('Animal com histórico de doença reprodutiva');
      recommendations.push('Avaliação veterinária prévia recomendada');
    }

    // Reproductive status
    if (animal.reproductiveStatus === 'Ready') {
      score += 5;
      positiveFactors.push('Animal com status Apto');
    } else if (animal.reproductiveStatus === 'Pregnant') {
      alerts.push('Animal já está prenhe');
    }

    // Breeder score
    if (breeder) {
      if (breeder.fertilityScore >= 80) {
        score += 10;
        positiveFactors.push(`Reprodutor com alta fertilidade (score ${breeder.fertilityScore})`);
      } else if (breeder.fertilityScore >= 60) {
        score += 5;
        positiveFactors.push(`Reprodutor com fertilidade razoável (score ${breeder.fertilityScore})`);
      } else {
        alerts.push(`Reprodutor com fertilidade abaixo do ideal (score ${breeder.fertilityScore})`);
        recommendations.push('Considerar troca de reprodutor');
      }
    }

    // Protocol
    if (dto.protocol === 'FTAI' || dto.protocol === 'FTAI with eCG') {
      score += 5;
      positiveFactors.push(`Protocolo ${dto.protocol} — alta precisão de sincronização`);
    }

    // Ambient temperature
    if (dto.ambientTemperature && dto.ambientTemperature > 32) {
      score -= 5;
      alerts.push(`Temperatura elevada (${dto.ambientTemperature}°C) — risco de estresse térmico`);
      recommendations.push('Realizar inseminação no período mais fresco do dia (madrugada/manhã cedo)');
    }

    // Season
    if (dto.season === 'dry') {
      score -= 5;
      alerts.push('Estação seca — maior risco nutricional');
      recommendations.push('Garantir suplementação durante o período seco');
    }

    // Farm historical pregnancy rate
    if (animal.farm?.averagePregnancyRate >= 65) {
      score += 5;
      positiveFactors.push(`Fazenda com boa taxa histórica (${animal.farm.averagePregnancyRate}%)`);
    }

    score = Math.max(0, Math.min(100, score));

    if (recommendations.length === 0) {
      recommendations.push('Realizar diagnóstico de gestação entre 28-35 dias pós-inseminação');
    } else {
      recommendations.push('Monitorar prenhez em 30 dias');
    }

    const finalScore = Math.round(35 + score * 0.6);

    return {
      pregnancyProbability: finalScore,
      fertilityScore: score,
      riskLevel: score >= 70 ? 'low' : score >= 45 ? 'moderate' : 'high',
      geneticCompatibility: breeder ? Math.min(100, breeder.fertilityScore + 5) : null,
      positiveFactors,
      alerts,
      recommendations,
      protocol: dto.protocol,
    };
  }
}
