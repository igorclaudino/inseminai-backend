import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Period = 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'all';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary(farmId: string, period: Period = 'last_month', species?: string) {

    const startDate = this.calcStartDate(period);
    const dateFilter = startDate ? { gte: startDate } : undefined;
    const speciesFilter = species ? { species } : {};

    const [
      totalAnimals,
      totalAnimalsBefore,
      activeBreederCount,
      activeBreederCountBefore,
      successfulInseminations,
      successfulInseminationsBefore,
      failedInseminations,
      failedInseminationsBefore,
      bySpecies,
    ] = await Promise.all([
      this.prisma.animal.count({ where: { farmId, active: true, ...speciesFilter } }),
      this.prisma.animal.count({
        where: { farmId, active: true, ...speciesFilter, ...(startDate ? { createdAt: { lt: startDate } } : {}) },
      }),
      this.prisma.breeder.count({ where: { farmId, active: true, ...(species ? { species } : {}) } }),
      this.prisma.breeder.count({
        where: { farmId, active: true, ...(species ? { species } : {}), ...(startDate ? { createdAt: { lt: startDate } } : {}) },
      }),
      this.prisma.reproductiveEvent.count({
        where: {
          animal: { farmId, ...speciesFilter },
          pregnancyDiagnosis: 'positive',
          ...(dateFilter ? { eventDate: dateFilter } : {}),
        },
      }),
      this.prisma.reproductiveEvent.count({
        where: {
          animal: { farmId, ...speciesFilter },
          pregnancyDiagnosis: 'positive',
          ...(startDate ? { eventDate: { lt: startDate } } : {}),
        },
      }),
      this.prisma.reproductiveEvent.count({
        where: {
          animal: { farmId, ...speciesFilter },
          pregnancyDiagnosis: { in: ['negative', 'failed'] },
          ...(dateFilter ? { eventDate: dateFilter } : {}),
        },
      }),
      this.prisma.reproductiveEvent.count({
        where: {
          animal: { farmId, ...speciesFilter },
          pregnancyDiagnosis: { in: ['negative', 'failed'] },
          ...(startDate ? { eventDate: { lt: startDate } } : {}),
        },
      }),
      this.prisma.animal.groupBy({
        by: ['species'],
        where: { farmId, active: true },
        _count: true,
      }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const chartEvents = await this.prisma.reproductiveEvent.findMany({
      where: {
        animal: { farmId, ...speciesFilter },
        eventDate: { gte: sixMonthsAgo },
        eventType: { in: ['artificial_insemination', 'natural_mating', 'controlled_mating'] },
      },
      select: { eventDate: true, pregnancyDiagnosis: true },
      orderBy: { eventDate: 'asc' },
    });

    const chart = this.groupByMonth(chartEvents);

    const totalEvaluated = successfulInseminations + failedInseminations;
    const pregnancyRate = totalEvaluated > 0 ? Math.round((successfulInseminations / totalEvaluated) * 100) : 0;

    const calcChange = (current: number, previous: number) =>
      previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);

    return {
      cards: {
        totalAnimals: { value: totalAnimals, change: calcChange(totalAnimals, totalAnimalsBefore) },
        activeBreeders: { value: activeBreederCount, change: calcChange(activeBreederCount, activeBreederCountBefore) },
        successfulInseminations: { value: successfulInseminations, change: calcChange(successfulInseminations, successfulInseminationsBefore) },
        failedInseminations: { value: failedInseminations, change: calcChange(failedInseminations, failedInseminationsBefore) },
        pregnancyRate,
      },
      chart,
      bySpecies: bySpecies.map((e) => ({ species: e.species, count: e._count })),
    };
  }

  private groupByMonth(events: { eventDate: Date; pregnancyDiagnosis: string }[]) {
    const map = new Map<string, { month: string; total: number; successful: number }>();

    for (const e of events) {
      const month = `${e.eventDate.getFullYear()}-${String(e.eventDate.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(month)) map.set(month, { month, total: 0, successful: 0 });
      const entry = map.get(month)!;
      entry.total += 1;
      if (e.pregnancyDiagnosis === 'positive') entry.successful += 1;
    }

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  private calcStartDate(period: Period): Date | null {
    const days: Record<string, number> = {
      last_week: 7,
      last_month: 30,
      last_quarter: 90,
      last_year: 365,
    };
    const d = days[period];
    if (!d) return null;
    return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  }
}
