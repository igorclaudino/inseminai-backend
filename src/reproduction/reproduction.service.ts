import { Injectable, NotFoundException } from '@nestjs/common';
import { Species } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { paginate } from '../common/dto/pagination.dto';
import { BreedersService } from '../breeders/breeders.service';

@Injectable()
export class ReproductionService {
  constructor(private prisma: PrismaService, private breedersService: BreedersService) {}

  async createEvent(dto: CreateEventDto, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: dto.animalId } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const event = await this.prisma.reproductiveEvent.create({
      data: {
        animalId: dto.animalId,
        breederId: dto.breederId,
        eventType: dto.eventType,
        inseminator: dto.inseminator,
        semenUsed: dto.semenUsed,
        lot: dto.lot,
        reproductiveProtocol: dto.reproductiveProtocol,
        eventDate: new Date(dto.eventDate),
        notes: dto.notes,
        pregnancyDiagnosis: 'pending',
      },
      include: { animal: { select: { id: true, name: true, identifier: true } }, breeder: true },
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
      animalUpdate.lastBirthDate = new Date(dto.eventDate);
      animalUpdate.birthCount = { increment: 1 };
    }
    if (dto.eventType === 'abortion') animalUpdate.abortionCount = { increment: 1 };
    if (dto.eventType === 'heat') animalUpdate.heatDetectionCount = { increment: 1 };

    if (Object.keys(animalUpdate).length > 0) {
      await this.prisma.animal.update({ where: { id: dto.animalId }, data: animalUpdate });
    }

    return event;
  }

  async list(
    farmId: string,
    filters: { search?: string; species?: string; pregnancyDiagnosis?: string; result?: string; from?: string; to?: string },
    page = 1,
    limit = 20,
  ) {
    const where = {
      animal: {
        farmId,
        ...(filters.species && { species: filters.species as Species }),
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { identifier: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }),
      },
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
          breeder: { select: { id: true, name: true } },
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
      include: { breeder: { select: { id: true, name: true } }, prediction: true },
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
        confirmationDate: dto.confirmationDate ? new Date(dto.confirmationDate) : new Date(),
      },
    });

    if (dto.pregnancyDiagnosis === 'positive') {
      await this.prisma.animal.update({
        where: { id: event.animalId },
        data: { pregnancyHistory: { increment: 1 }, reproductiveStatus: 'Pregnant' },
      });
      if (event.breederId) await this.breedersService.recordInseminationResult(event.breederId, true);
    } else if (['negative', 'conception_failure'].includes(dto.pregnancyDiagnosis)) {
      await this.prisma.animal.update({
        where: { id: event.animalId },
        data: { reproductiveStatus: 'Ready' },
      });
      if (event.breederId) await this.breedersService.recordInseminationResult(event.breederId, false);
    }

    return updatedEvent;
  }
}
