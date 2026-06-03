import { Injectable, NotFoundException } from '@nestjs/common';
import { AiProfileId } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ScoringService } from '../../domain/scoring/scoring.service';
import { AiInsightsService } from '../../ai/ai-insights.service';
import { AI_PROFILES, AiProfileConfig } from '../../ai/ai-profile.constants';
import { PredictPregnancyDto } from '../../ai/dto/predict-pregnancy.dto';
import { ScoreOutput } from '../../domain/scoring/scoring.types';

export interface PredictPregnancyResult extends ScoreOutput {
  aiInsight: string;
  _meta: {
    aiProfile: string;
    aiProfileName: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class PredictPregnancyUseCase {
  constructor(
    private prisma: PrismaService,
    private scoring: ScoringService,
    private insights: AiInsightsService,
  ) {}

  async execute(dto: PredictPregnancyDto, farmId: string): Promise<PredictPregnancyResult> {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      include: {
        farm: true,
        weighings: { orderBy: { weighingDate: 'desc' }, take: 1 },
      },
    });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const sire = dto.sireId
      ? await this.prisma.animal.findUnique({ where: { id: dto.sireId } })
      : null;

    const currentWeight = animal.weighings[0]?.weightKg ?? 0;
    const profile: AiProfileConfig = AI_PROFILES[animal.farm.aiProfile] ?? AI_PROFILES.standard;

    // Algoritmo determinístico como baseline e fallback
    let score = this.scoring.calculate({
      species: animal.species,
      lastBirthDate: animal.lastBirthDate,
      pregnancyHistory: animal.pregnancyHistory,
      abortionCount: animal.abortionCount,
      bodyConditionScore: animal.bodyConditionScore,
      reproductiveDiseaseHistory: animal.reproductiveDiseaseHistory,
      reproductiveStatus: animal.reproductiveStatus,
      farmAveragePregnancyRate: animal.farm.averagePregnancyRate,
      currentWeight,
      sire: sire ? { fertilityScore: sire.fertilityScore } : null,
      protocol: dto.protocol,
      ambientTemperature: dto.ambientTemperature,
      season: dto.season,
    });

    let aiInsight: string = this.insights.generateLocal(animal, currentWeight, score);
    let inputTokens = 0;
    let outputTokens = 0;

    if (profile.callsAi) {
      const aiResult = await this.insights.predictWithAI(animal, currentWeight, sire, dto);
      if (aiResult) {
        score = aiResult.score;
        aiInsight = aiResult.insight;
        inputTokens = aiResult.tokens.input;
        outputTokens = aiResult.tokens.output;
      }
    }

    await this.prisma.prediction.create({
      data: {
        animalId: dto.animalId,
        pregnancyProbability: score.pregnancyProbability,
        fertilityScore: score.fertilityScore,
        riskLevel: score.riskLevel,
        geneticCompatibility: score.geneticCompatibility,
        positiveFactors: score.positiveFactors,
        alerts: score.alerts,
        recommendations: score.recommendations,
        aiInsight,
        protocol: dto.protocol,
        ambientTemperature: dto.ambientTemperature ?? null,
        season: dto.season ?? null,
        aiProfile: profile.id as AiProfileId,
        inputTokens,
        outputTokens,
        analysisType: 'pregnancy',
        ...(dto.sireId && { sireId: dto.sireId }),
        ...(dto.reproductiveEventId && { reproductiveEventId: dto.reproductiveEventId }),
      },
    });

    return {
      ...score,
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
