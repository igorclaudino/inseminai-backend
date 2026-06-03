import { Injectable, NotFoundException } from '@nestjs/common';
import { AiProfileId, AnimalSex, Species } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ScoringService } from '../../domain/scoring/scoring.service';
import { AiInsightsService } from '../../ai/ai-insights.service';
import { AI_PROFILES, AiProfileConfig } from '../../ai/ai-profile.constants';
import { BestDamDto } from '../../ai/dto/best-dam.dto';

const MAX_CANDIDATES = 200;

@Injectable()
export class BestDamUseCase {
  constructor(
    private prisma: PrismaService,
    private scoring: ScoringService,
    private insights: AiInsightsService,
  ) {}

  async execute(farmId: string, dto: BestDamDto) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm not found');

    const limit = Math.min(dto.limit ?? 5, 20);

    const females = await this.prisma.animal.findMany({
      where: {
        farmId,
        sex: AnimalSex.female,
        active: true,
        reproductiveStatus: { notIn: ['Pregnant', 'Inactive', 'Culled'] },
        ...(dto.species && { species: dto.species as Species }),
      },
      include: {
        farm: true,
        weighings: { orderBy: { weighingDate: 'desc' }, take: 1 },
      },
      take: MAX_CANDIDATES,
      orderBy: { updatedAt: 'desc' },
    });

    if (!females.length) throw new NotFoundException('No eligible females found for the given filters');

    const scored = females
      .map((animal) => {
        const currentWeight = animal.weighings[0]?.weightKg ?? 0;
        const result = this.scoring.calculate({
          species: animal.species,
          lastBirthDate: animal.lastBirthDate,
          pregnancyHistory: animal.pregnancyHistory,
          abortionCount: animal.abortionCount,
          bodyConditionScore: animal.bodyConditionScore,
          reproductiveDiseaseHistory: animal.reproductiveDiseaseHistory,
          reproductiveStatus: animal.reproductiveStatus,
          farmAveragePregnancyRate: animal.farm.averagePregnancyRate,
          currentWeight,
          protocol: dto.protocol ?? 'IATF',
          ambientTemperature: dto.ambientTemperature,
          season: dto.season,
        });
        return { animal, currentWeight, result };
      })
      .sort((a, b) => b.result.pregnancyProbability - a.result.pregnancyProbability);

    const topAnimals = scored.slice(0, limit);

    const profile: AiProfileConfig = AI_PROFILES[farm.aiProfile] ?? AI_PROFILES.standard;

    // Algoritmo como baseline e fallback
    let finalAnimals = topAnimals;
    let recommendations = topAnimals.map(
      (p, i) => `${i + 1}. ${p.animal.name} (${p.animal.species} ${p.animal.breed}) — ${p.result.pregnancyProbability}% | risco ${p.result.riskLevel}`,
    );
    let aiInsight =
      `Melhores matrizes para inseminação: ` +
      topAnimals.slice(0, 3).map((p, i) => `${i + 1}º ${p.animal.name} (${p.result.pregnancyProbability}%, risco ${p.result.riskLevel})`).join('; ') + '.';
    let inputTokens = 0;
    let outputTokens = 0;

    if (profile.callsAi) {
      const aiResult = await this.insights.bestDamWithAI(topAnimals, dto, profile);
      if (aiResult) {
        const aiMap = new Map(aiResult.ranking.map((r) => [r.animalId, r]));
        const updated = topAnimals.map((p) => {
          const ai = aiMap.get(p.animal.id);
          if (!ai) return p;
          return {
            ...p,
            result: {
              ...p.result,
              pregnancyProbability: ai.pregnancyProbability,
              fertilityScore: ai.fertilityScore,
              riskLevel: ai.riskLevel,
              positiveFactors: ai.positiveFactors,
              alerts: ai.alerts,
            },
          };
        }).sort((a, b) => b.result.pregnancyProbability - a.result.pregnancyProbability);

        finalAnimals = updated;
        recommendations = aiResult.recommendations;
        aiInsight = aiResult.aiInsight;
        inputTokens = aiResult.tokens.input;
        outputTokens = aiResult.tokens.output;
      }
    }

    const topAnimal = finalAnimals[0];
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
        recommendations,
        aiInsight,
        protocol: dto.protocol,
        ambientTemperature: dto.ambientTemperature ?? null,
        season: dto.season ?? null,
        aiProfile: profile.id as AiProfileId,
        inputTokens,
        outputTokens,
      },
    });

    return {
      farm: { id: farm.id, name: farm.name },
      parameters: {
        protocol: dto.protocol ?? 'IATF',
        ambientTemperature: dto.ambientTemperature ?? null,
        season: dto.season ?? null,
        species: dto.species ?? 'all',
      },
      totalAnimalsEvaluated: females.length,
      ranking: finalAnimals.map((p, i) => ({
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
}
