import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async farmPerformance(farmId: string) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });

    const [totalAnimals, bySpecies, totalEvents, pregnancies, predictions] = await Promise.all([
      this.prisma.animal.count({ where: { farmId, active: true } }),
      this.prisma.animal.groupBy({
        by: ['species'],
        where: { farmId, active: true },
        _count: true,
      }),
      this.prisma.reproductiveEvent.count({
        where: { animal: { farmId } },
      }),
      this.prisma.reproductiveEvent.count({
        where: { animal: { farmId }, pregnancyDiagnosis: 'positive' },
      }),
      this.prisma.prediction.findMany({
        where: { animal: { farmId } },
        select: { pregnancyProbability: true, riskLevel: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const overallPregnancyRate = totalEvents > 0 ? Math.round((pregnancies / totalEvents) * 100) : 0;
    const avgProbability =
      predictions.length > 0
        ? Math.round(predictions.reduce((acc, p) => acc + p.pregnancyProbability, 0) / predictions.length)
        : 0;

    const riskDistribution = predictions.reduce(
      (acc, p) => {
        acc[p.riskLevel] = (acc[p.riskLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      farm: { id: farm!.id, name: farm!.name },
      summary: {
        totalAnimals,
        totalEvents,
        pregnancies,
        overallPregnancyRate,
        avgAiProbability: avgProbability,
      },
      bySpecies: bySpecies.map((e) => ({ species: e.species, count: e._count })),
      riskDistribution,
    };
  }

  async animalPerformance(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        weighings: { orderBy: { weighingDate: 'desc' }, take: 1 },
      },
    });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const [events, predictions] = await Promise.all([
      this.prisma.reproductiveEvent.findMany({
        where: { animalId },
        include: { breeder: true },
        orderBy: { eventDate: 'desc' },
      }),
      this.prisma.prediction.findMany({
        where: { animalId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const eventsWithDiagnosis = events.filter((e) => e.pregnancyDiagnosis !== 'pending');
    const pregnancyRate =
      eventsWithDiagnosis.length > 0
        ? Math.round(
            (eventsWithDiagnosis.filter((e) => e.pregnancyDiagnosis === 'positive').length /
              eventsWithDiagnosis.length) *
              100,
          )
        : 0;

    const ageMonths = animal.birthDate
      ? Math.floor(
          (Date.now() - new Date(animal.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44),
        )
      : null;
    const weightKg = animal.weighings[0]?.weightKg ?? null;

    return {
      animal: {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        breed: animal.breed,
        sex: animal.sex,
        ageMonths,
        weightKg,
      },
      history: {
        totalEvents: events.length,
        pregnancies: animal.pregnancyHistory,
        abortions: animal.abortionCount,
        births: animal.birthCount,
        pregnancyRate,
        avgBirthInterval: animal.averageBirthInterval,
      },
      recentPredictions: predictions.slice(0, 5).map((p) => ({
        date: p.createdAt,
        probability: p.pregnancyProbability,
        risk: p.riskLevel,
      })),
      events: events.map((e) => ({
        id: e.id,
        date: e.eventDate,
        type: e.eventType,
        breeder: e.breeder?.name || null,
        result: e.pregnancyDiagnosis,
        confirmation: e.confirmationDate,
      })),
    };
  }

  async breederRanking(farmId: string) {
    return this.prisma.breeder.findMany({
      where: { farmId, active: true },
      orderBy: { fertilityScore: 'desc' },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        fertilityScore: true,
        totalInseminations: true,
        pregnancies: true,
      },
    });
  }
}
