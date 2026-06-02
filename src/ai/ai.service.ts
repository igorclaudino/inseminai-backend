import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AiProfileId } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAiProfileDto } from './dto/update-ai-profile.dto';
import { AI_PROFILES, VALID_AI_PROFILES, AI_PRICING, calcCostUsd } from './ai-profile.constants';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

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
        brl: +(p.costUsdPer1000 * AI_PRICING.usdToBrl).toFixed(2),
      },
    }));
  }

  async getAiConfig(farmId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm not found');

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
      data: { aiProfile: dto.aiProfile as AiProfileId },
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

  async consumptionReport(farmId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm not found');

    const [totalAnalyses, tokenAgg, byProfileRaw] = await Promise.all([
      this.prisma.prediction.count({ where: { animal: { farmId } } }),
      this.prisma.prediction.aggregate({
        where: { animal: { farmId } },
        _sum: { inputTokens: true, outputTokens: true },
      }),
      this.prisma.prediction.groupBy({
        by: ['aiProfile'],
        where: { animal: { farmId } },
        _count: true,
        _sum: { inputTokens: true, outputTokens: true },
      }),
    ]);

    const totalInputTokens = tokenAgg._sum.inputTokens ?? 0;
    const totalOutputTokens = tokenAgg._sum.outputTokens ?? 0;
    const totalTokens = totalInputTokens + totalOutputTokens;

    const actualCostUsd = calcCostUsd(totalInputTokens, totalOutputTokens);

    const expertProfile = AI_PROFILES.expert;
    const hypotheticalExpertCostUsd = calcCostUsd(
      totalAnalyses * expertProfile.estimatedInputTokens,
      totalAnalyses * expertProfile.estimatedOutputTokens,
    );
    const savingsUsd = Math.max(0, hypotheticalExpertCostUsd - actualCostUsd);

    const byProfileMap = new Map(
      byProfileRaw.map((r) => [
        VALID_AI_PROFILES.includes(r.aiProfile as string) ? (r.aiProfile as string) : 'standard',
        { count: r._count, inputTokens: r._sum.inputTokens ?? 0, outputTokens: r._sum.outputTokens ?? 0 },
      ]),
    );

    const profileDetails = VALID_AI_PROFILES.map((id) => {
      const data = byProfileMap.get(id) ?? { count: 0, inputTokens: 0, outputTokens: 0 };
      const profile = AI_PROFILES[id];
      const totalTk = data.inputTokens + data.outputTokens;
      const profileCost = calcCostUsd(data.inputTokens, data.outputTokens);

      return {
        profileId: id,
        profileName: profile.name,
        icon: profile.icon,
        summary: profile.summary,
        totalAnalyses: data.count,
        usagePercentage: totalAnalyses > 0 ? +((data.count / totalAnalyses) * 100).toFixed(1) : 0,
        tokens: {
          averageActualPerAnalysis: data.count > 0 ? Math.round(totalTk / data.count) : 0,
          estimatedPerAnalysis: profile.estimatedInputTokens + profile.estimatedOutputTokens,
          totalConsumed: totalTk,
        },
        cost: {
          totalUsd: +profileCost.toFixed(6),
          totalBrl: +(profileCost * AI_PRICING.usdToBrl).toFixed(4),
          estimatedPer1000AnalysesBrl: +(profile.costUsdPer1000 * AI_PRICING.usdToBrl).toFixed(2),
        },
        estimatedLatency: profile.estimatedLatency,
      };
    });

    const projections = VALID_AI_PROFILES.map((id) => {
      const profile = AI_PROFILES[id];
      return {
        profileId: id,
        profileName: profile.name,
        for100AnalysesBrl: +(profile.costUsdPer1000 * AI_PRICING.usdToBrl * 0.1).toFixed(2),
        for1000AnalysesBrl: +(profile.costUsdPer1000 * AI_PRICING.usdToBrl).toFixed(2),
        for10000AnalysesBrl: +(profile.costUsdPer1000 * AI_PRICING.usdToBrl * 10).toFixed(2),
      };
    });

    return {
      farm: { id: farm.id, name: farm.name, currentProfile: farm.aiProfile },
      summary: {
        totalAnalyses,
        totalTokensConsumed: totalTokens,
        actualAccumulatedCost: {
          usd: +actualCostUsd.toFixed(6),
          brl: +(actualCostUsd * AI_PRICING.usdToBrl).toFixed(4),
        },
        savingsVsExpertTotal: {
          usd: +savingsUsd.toFixed(6),
          brl: +(savingsUsd * AI_PRICING.usdToBrl).toFixed(4),
          percentage: hypotheticalExpertCostUsd > 0
            ? +((savingsUsd / hypotheticalExpertCostUsd) * 100).toFixed(1)
            : 0,
        },
      },
      byProfile: profileDetails,
      costProjections: projections,
      _note:
        `Cost calculated based on GPT-4o-mini (US$ ${(AI_PRICING.inputPerToken * 1_000_000).toFixed(3)}/1M input tokens, ` +
        `US$ ${(AI_PRICING.outputPerToken * 1_000_000).toFixed(3)}/1M output tokens). ` +
        `Reference exchange rate: R$ ${AI_PRICING.usdToBrl.toFixed(2)}/USD. Approximate values for planning purposes.`,
    };
  }

  async deletePrediction(predictionId: string, farmId: string) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id: predictionId },
      include: { animal: { select: { farmId: true } } },
    });

    if (!prediction) throw new NotFoundException('Prediction not found');
    if (prediction.animal?.farmId !== farmId) throw new NotFoundException('Prediction not found');

    await this.prisma.prediction.delete({ where: { id: predictionId } });

    return { message: 'Prediction deleted successfully' };
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
}
