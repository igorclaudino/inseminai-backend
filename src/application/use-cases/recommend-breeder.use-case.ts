import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AiProfileId, AnimalSex } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiInsightsService } from '../../ai/ai-insights.service';
import { AI_PROFILES, AiProfileConfig } from '../../ai/ai-profile.constants';

@Injectable()
export class RecommendBreederUseCase {
  constructor(
    private prisma: PrismaService,
    private insights: AiInsightsService,
  ) {}

  async execute(farmId: string, animalId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm not found');

    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: { weighings: { orderBy: { weighingDate: 'desc' }, take: 1 } },
    });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.sex !== AnimalSex.female) throw new BadRequestException('Breeder recommendation only applies to females');

    const males = await this.prisma.animal.findMany({
      where: { farmId, species: animal.species, sex: AnimalSex.male, active: true },
      orderBy: { fertilityScore: 'desc' },
    });
    if (!males.length) throw new NotFoundException('No active male animals found for this species');

    const currentWeight = animal.weighings[0]?.weightKg ?? 0;

    const ranking = males
      .map((m) => {
        let compatibility = m.fertilityScore > 0 ? m.fertilityScore : 50;
        if (m.breed.toLowerCase() !== animal.breed.toLowerCase()) compatibility = Math.min(100, compatibility + 5);
        if (m.totalInseminations >= 10) compatibility = Math.min(100, compatibility + 3);
        if (m.fertilityScore > 0 && m.fertilityScore < 60) compatibility = Math.max(0, compatibility - 10);

        const classification =
          compatibility >= 85 ? 'Excelente' :
          compatibility >= 70 ? 'Muito Bom' :
          compatibility >= 55 ? 'Bom' : 'Regular';

        return { animal: m, compatibility, classification };
      })
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 5);

    const profile: AiProfileConfig = AI_PROFILES[farm.aiProfile] ?? AI_PROFILES.standard;

    let aiInsight = '';
    let inputTokens = 0;
    let outputTokens = 0;

    if (!profile.callsAi) {
      const best = ranking[0];
      aiInsight =
        `Reprodutor recomendado: ${best.animal.name} (${best.animal.breed}, compatibilidade ${best.compatibility}/100). ` +
        `${ranking.length > 1 ? `Alternativa: ${ranking[1].animal.name} (${ranking[1].compatibility}/100).` : ''}`;
    } else {
      const result = await this.insights.generateForRecommendBreeder(animal, currentWeight, ranking, profile);
      aiInsight = result.text;
      inputTokens = result.tokens.input;
      outputTokens = result.tokens.output;
    }

    await this.prisma.prediction.create({
      data: {
        animalId,
        sireId: ranking[0].animal.id,
        analysisType: 'best_breeder',
        pregnancyProbability: ranking[0].compatibility,
        fertilityScore: ranking[0].animal.fertilityScore,
        riskLevel: ranking[0].compatibility >= 70 ? 'low' : ranking[0].compatibility >= 50 ? 'moderate' : 'high',
        geneticCompatibility: ranking[0].compatibility,
        positiveFactors: ranking.slice(0, 3).map((r) => `${r.animal.name} (${r.classification}, score ${r.compatibility})`),
        alerts: ranking
          .filter((r) => r.animal.fertilityScore > 0 && r.animal.fertilityScore < 60)
          .map((r) => `${r.animal.name} com fertilidade abaixo do ideal`),
        recommendations: ranking.map(
          (r, i) => `${i + 1}. ${r.animal.name} — ${r.animal.breed} | compatibilidade ${r.compatibility}/100 | ${r.classification}`,
        ),
        aiInsight,
        aiProfile: profile.id as AiProfileId,
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
      ranking: ranking.map((item, i) => ({
        position: i + 1,
        sire: {
          id: item.animal.id,
          identifier: item.animal.identifier,
          name: item.animal.name,
          breed: item.animal.breed,
          fertilityScore: item.animal.fertilityScore,
          totalInseminations: item.animal.totalInseminations,
          pregnanciesAsBreeder: item.animal.pregnanciesAsBreeder,
          actualPregnancyRate: item.animal.totalInseminations > 0
            ? Math.round((item.animal.pregnanciesAsBreeder / item.animal.totalInseminations) * 100)
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
}
