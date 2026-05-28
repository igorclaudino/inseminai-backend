import { Injectable, NotFoundException } from '@nestjs/common';
import { Species, AnimalSex } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { DeleteAnimalDto } from './dto/delete-animal.dto';
import { paginate } from '../common/dto/pagination.dto';
import { calcDaysPostpartum } from '../common/helpers/days-postpartum';

@Injectable()
export class AnimalsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAnimalDto, farmId: string) {
    const { initialWeight, initialWeighingDate, ...animalData } = dto;

    return this.prisma.animal.create({
      data: {
        ...animalData,
        species: animalData.species as Species,
        sex: animalData.sex as AnimalSex,
        farmId,
        birthDate: animalData.birthDate ? new Date(animalData.birthDate) : undefined,
        weighings: initialWeight
          ? { create: { weightKg: initialWeight, weighingDate: initialWeighingDate ? new Date(initialWeighingDate) : new Date() } }
          : undefined,
      },
      include: { weighings: { orderBy: { weighingDate: 'desc' }, take: 1 } },
    });
  }

  async list(
    farmId: string,
    filters: { species?: string; sex?: string; breed?: string; search?: string },
    page = 1,
    limit = 20,
  ) {
    const where = {
      farmId,
      active: true,
      deletedAt: null,
      ...(filters.species && { species: filters.species as Species }),
      ...(filters.sex && { sex: filters.sex as AnimalSex }),
      ...(filters.breed && { breed: filters.breed }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { identifier: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [animals, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        include: {
          weighings: { orderBy: { weighingDate: 'desc' }, take: 1 },
          sire: { select: { id: true, name: true, identifier: true } },
          dam: { select: { id: true, name: true, identifier: true } },
          _count: { select: { reproductiveEvents: true } },
        },
        orderBy: { identifier: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.animal.count({ where }),
    ]);

    const data = animals.map((a) => ({
      ...a,
      daysPostpartum: calcDaysPostpartum(a.lastBirthDate),
      currentWeight: a.weighings[0]?.weightKg ?? null,
    }));

    return paginate(data, total, page, limit);
  }

  async findById(id: string, farmId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id, deletedAt: null },
      include: {
        farm: true,
        sire: { select: { id: true, name: true, identifier: true } },
        dam: { select: { id: true, name: true, identifier: true } },
        weighings: { orderBy: { weighingDate: 'desc' } },
        reproductiveEvents: {
          include: { breeder: { select: { id: true, name: true } } },
          orderBy: { eventDate: 'desc' },
        },
        predictions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    return {
      ...animal,
      daysPostpartum: calcDaysPostpartum(animal.lastBirthDate),
      currentWeight: animal.weighings[0]?.weightKg ?? null,
    };
  }

  async update(id: string, dto: UpdateAnimalDto, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id, deletedAt: null } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const { initialWeight, initialWeighingDate, ...animalData } = dto;

    return this.prisma.animal.update({
      where: { id },
      data: {
        ...animalData,
        ...(animalData.species && { species: animalData.species as Species }),
        ...(animalData.sex && { sex: animalData.sex as AnimalSex }),
        birthDate: animalData.birthDate ? new Date(animalData.birthDate) : undefined,
      },
    });
  }

  async remove(id: string, dto: DeleteAnimalDto, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id, deletedAt: null } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    return this.prisma.animal.update({
      where: { id },
      data: { active: false, deletedAt: new Date(), deletionReason: dto.deletionReason },
    });
  }
}
