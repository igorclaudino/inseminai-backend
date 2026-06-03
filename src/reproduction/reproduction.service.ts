import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Species } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateInseminationDto } from './dto/create-insemination.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { paginate } from '../common/dto/pagination.dto';
import { parseDateString } from '../common/helpers/parse-date';

@Injectable()
export class ReproductionService {
  private readonly logger = new Logger(ReproductionService.name);
  constructor(private prisma: PrismaService) {}

  async createEvent(dto: CreateEventDto, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: dto.animalId } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const event = await this.prisma.reproductiveEvent.create({
      data: {
        animalId: dto.animalId,
        sireId: dto.sireId,
        eventType: dto.eventType,
        inseminator: dto.inseminator,
        semenUsed: dto.semenUsed,
        lot: dto.lot,
        reproductiveProtocol: dto.reproductiveProtocol,
        eventDate: parseDateString(dto.eventDate),
        notes: dto.notes,
        pregnancyDiagnosis: 'pending',
      },
      include: {
        animal: { select: { id: true, name: true, identifier: true } },
        sireAnimal: { select: { id: true, name: true, identifier: true } },
      },
    });

    const statusMap: Record<string, string> = {
      artificial_insemination: 'In Reproduction',
      natural_mating: 'In Reproduction',
      controlled_mating: 'In Reproduction',
      pregnancy: 'Pregnant',
      birth: 'Ready',
      abortion: 'Ready',
    };

    const animalUpdate: Record<string, any> = {};
    if (statusMap[dto.eventType]) animalUpdate.reproductiveStatus = statusMap[dto.eventType];
    if (dto.eventType === 'birth') {
      animalUpdate.lastBirthDate = parseDateString(dto.eventDate);
      animalUpdate.birthCount = { increment: 1 };
    }
    if (dto.eventType === 'abortion') animalUpdate.abortionCount = { increment: 1 };
    if (dto.eventType === 'heat') animalUpdate.heatDetectionCount = { increment: 1 };

    if (Object.keys(animalUpdate).length > 0) {
      await this.prisma.animal.update({ where: { id: dto.animalId }, data: animalUpdate });
    }

    // Track insemination count on sire animal
    if (dto.sireId && ['artificial_insemination', 'natural_mating', 'controlled_mating'].includes(dto.eventType)) {
      await this.prisma.animal.update({
        where: { id: dto.sireId },
        data: { totalInseminations: { increment: 1 } },
      });
    }

    return event;
  }

  async createInsemination(dto: CreateInseminationDto, farmId: string) {
    this.logger.debug(`createInsemination DTO: ${JSON.stringify(dto)}`);
    return this.createEvent(
      {
        animalId: dto.animalId,
        sireId: dto.sireId ?? dto.breederId,
        eventType: 'artificial_insemination',
        inseminator: dto.inseminator,
        semenUsed: dto.semenUsed,
        lot: dto.lot,
        reproductiveProtocol: dto.reproductiveProtocol,
        eventDate: dto.eventDate,
        notes: dto.notes,
      },
      farmId,
    );
  }

  async list(
    farmId: string,
    filters: { search?: string; species?: string; pregnancyDiagnosis?: string; result?: string; from?: string; to?: string; eventType?: string },
    page = 1,
    limit = 20,
  ) {
    const where = {
      animal: {
        farmId,
        ...(filters.species && { species: filters.species as Species }),
      },
      ...(filters.eventType && { eventType: filters.eventType }),
      ...(filters.search && {
        OR: [
          { inseminator: { contains: filters.search, mode: 'insensitive' as const } },
          { sireAnimal: { name: { contains: filters.search, mode: 'insensitive' as const } } },
        ],
      }),
      ...(filters.pregnancyDiagnosis && { pregnancyDiagnosis: filters.pregnancyDiagnosis }),
      ...(filters.result && { result: filters.result }),
      ...((filters.from || filters.to) && {
        eventDate: {
          ...(filters.from && { gte: new Date(filters.from) }),
          ...(filters.to && { lte: new Date(filters.to) }),
        },
      }),
    };

    const [events, total] = await Promise.all([
      this.prisma.reproductiveEvent.findMany({
        where,
        include: {
          animal: { select: { id: true, name: true, identifier: true, species: true } },
          sireAnimal: { select: { id: true, name: true, identifier: true, breed: true, fertilityScore: true } },
          prediction: { select: { pregnancyProbability: true, riskLevel: true } },
        },
        orderBy: { eventDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reproductiveEvent.count({ where }),
    ]);

    return paginate(events, total, page, limit);
  }

  async listByAnimal(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    return this.prisma.reproductiveEvent.findMany({
      where: { animalId },
      include: {
        sireAnimal: { select: { id: true, name: true, identifier: true } },
        prediction: true,
      },
      orderBy: { eventDate: 'desc' },
    });
  }

  async updateDiagnosis(eventId: string, dto: UpdateDiagnosisDto, farmId: string) {
    const event = await this.prisma.reproductiveEvent.findUnique({
      where: { id: eventId },
      include: { animal: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.animal.farmId !== farmId) throw new NotFoundException('Event not found');

    const updatedEvent = await this.prisma.reproductiveEvent.update({
      where: { id: eventId },
      data: {
        pregnancyDiagnosis: dto.pregnancyDiagnosis,
        result: dto.result,
        confirmationDate: dto.confirmationDate ? parseDateString(dto.confirmationDate) : new Date(),
      },
    });

    if (dto.pregnancyDiagnosis === 'positive') {
      const confirmationDate = dto.confirmationDate ? parseDateString(dto.confirmationDate) : new Date();
      await Promise.all([
        this.prisma.animal.update({
          where: { id: event.animalId },
          data: { pregnancyHistory: { increment: 1 }, reproductiveStatus: 'Pregnant' },
        }),
        this.prisma.reproductiveEvent.create({
          data: {
            animalId: event.animalId,
            sireId: event.sireId,
            eventType: 'pregnancy',
            eventDate: confirmationDate,
            pregnancyDiagnosis: 'positive',
            notes: `Prenhez confirmada — diagnóstico do evento de inseminação #${event.id.slice(-6)}`,
          },
        }),
      ]);
      if (event.sireId) await this.updateSireFertility(event.sireId, true);
    } else if (['negative', 'conception_failure'].includes(dto.pregnancyDiagnosis)) {
      await this.prisma.animal.update({
        where: { id: event.animalId },
        data: { reproductiveStatus: 'Ready' },
      });
      if (event.sireId) await this.updateSireFertility(event.sireId, false);
    }

    return updatedEvent;
  }

  private async updateSireFertility(sireId: string, pregnant: boolean) {
    const sire = await this.prisma.animal.update({
      where: { id: sireId },
      data: pregnant
        ? { pregnanciesAsBreeder: { increment: 1 } }
        : {},
    });

    const score = sire.totalInseminations > 0
      ? Math.round((sire.pregnanciesAsBreeder / sire.totalInseminations) * 100)
      : 0;

    await this.prisma.animal.update({
      where: { id: sireId },
      data: { fertilityScore: score },
    });
  }
}
