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

    const breeders = await this.prisma.breeder.findMany({
      where: { farmId, species: animal.species, active: true },
      orderBy: { fertilityScore: 'desc' },
    });
    if (!breeders.length) throw new NotFoundException('No active breeders found for this species');

    const currentWeight = animal.weighings[0]?.weightKg ?? 0;

    const ranking = breeders
      .map((b) => {
        let compatibility = b.fertilityScore;
        if (b.breed.toLowerCase() !== animal.breed.toLowerCase()) compatibility = Math.min(100, compatibility + 5);
        if (b.totalInseminations >= 10) compatibility = Math.min(100, compatibility + 3);
        if (b.fertilityScore < 60) compatibility = Math.max(0, compatibility - 10);

        const classification =
          compatibility >= 85 ? 'Excellent' :
          compatibility >= 70 ? 'Very Good' :
          compatibility >= 55 ? 'Good' : 'Fair';

        return { breeder: b, compatibility, classification };
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
        `Reprodutor recomendado: ${best.breeder.name} (${best.breeder.breed}, compatibilidade ${best.compatibility}/100). ` +
        `${ranking.length > 1 ? `Alternativa: ${ranking[1].breeder.name} (${ranking[1].compatibility}/100).` : ''}`;
    } else {
      const result = await this.insights.generateForBreeder(animal, currentWeight, ranking, profile);
      aiInsight = result.text;
      inputTokens = result.tokens.input;
      outputTokens = result.tokens.output;
    }

    await this.prisma.prediction.create({
      data: {
        animalId,
        breederId: ranking[0].breeder.id,
        analysisType: 'best_breeder',
        pregnancyProbability: ranking[0].compatibility,
        fertilityScore: ranking[0].breeder.fertilityScore,
        riskLevel: ranking[0].compatibility >= 70 ? 'low' : ranking[0].compatibility >= 50 ? 'moderate' : 'high',
        geneticCompatibility: ranking[0].compatibility,
        positiveFactors: ranking.slice(0, 3).map((r) => `${r.breeder.name} (${r.classification}, score ${r.compatibility})`),
        alerts: ranking.filter((r) => r.breeder.fertilityScore < 60).map((r) => `${r.breeder.name} with below-ideal fertility`),
        recommendations: ranking.map((r, i) => `${i + 1}. ${r.breeder.name} — ${r.breeder.breed} | compatibility ${r.compatibility}/100 | ${r.classification}`),
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
}
