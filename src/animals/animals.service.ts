import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Species, AnimalSex } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { DeleteAnimalDto } from './dto/delete-animal.dto';
import { paginate } from '../common/dto/pagination.dto';
import { calcDaysPostpartum } from '../common/helpers/days-postpartum';
import { parseDateString } from '../common/helpers/parse-date';

const SPECIES_PREFIX: Record<string, string> = { cattle: 'BOV', sheep: 'OVI', goat: 'CAP' };

function calcAge(birthDate: Date | null | undefined): string | null {
  if (!birthDate) return null;
  const now = new Date();
  const months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  if (months < 1) return 'Menos de 1 mês';
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

@Injectable()
export class AnimalsService {
  constructor(private prisma: PrismaService) {}

  private async generateIdentifier(farmId: string, species: string): Promise<string> {
    const prefix = SPECIES_PREFIX[species] ?? 'ANI';
    const existing = await this.prisma.animal.findMany({
      where: { farmId, identifier: { startsWith: `${prefix}-` } },
      select: { identifier: true },
    });
    const numbers = existing
      .map((a) => parseInt(a.identifier.replace(`${prefix}-`, ''), 10))
      .filter((n) => !isNaN(n));
    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `${prefix}-${String(next).padStart(4, '0')}`;
  }

  async create(dto: CreateAnimalDto, farmId: string) {
    const { initialWeight, initialWeighingDate, ...animalData } = dto;

    const identifier = animalData.identifier ?? await this.generateIdentifier(farmId, animalData.species);

    return this.prisma.animal.create({
      data: {
        ...animalData,
        identifier,
        species: animalData.species as Species,
        sex: animalData.sex as AnimalSex,
        farmId,
        birthDate: animalData.birthDate ? parseDateString(animalData.birthDate) : undefined,
        weighings: initialWeight
          ? { create: { weightKg: initialWeight, weighingDate: initialWeighingDate ? parseDateString(initialWeighingDate) : new Date() } }
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
      age: calcAge(a.birthDate),
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
          include: { sireAnimal: { select: { id: true, name: true, identifier: true } } },
          orderBy: { eventDate: 'desc' },
        },
        inseminationsAsSire: {
          include: { animal: { select: { id: true, name: true, identifier: true, species: true } } },
          orderBy: { eventDate: 'desc' },
        },
        predictions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const { inseminationsAsSire, ...rest } = animal;
    const reproductiveEvents = [
      ...animal.reproductiveEvents,
      ...inseminationsAsSire,
    ].sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());

    return {
      ...rest,
      reproductiveEvents,
      daysPostpartum: calcDaysPostpartum(animal.lastBirthDate),
      currentWeight: animal.weighings[0]?.weightKg ?? null,
      age: calcAge(animal.birthDate),
    };
  }

  async update(id: string, dto: UpdateAnimalDto, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id, deletedAt: null } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const { initialWeight, initialWeighingDate, ...animalData } = dto;

    if (animalData.sireId) {
      if (animalData.sireId === id) throw new BadRequestException('An animal cannot be its own sire');
      if (await this.isAncestorOf(id, animalData.sireId))
        throw new BadRequestException('Circular parentage: this animal already appears in the ancestry of the proposed sire');
    }
    if (animalData.damId) {
      if (animalData.damId === id) throw new BadRequestException('An animal cannot be its own dam');
      if (await this.isAncestorOf(id, animalData.damId))
        throw new BadRequestException('Circular parentage: this animal already appears in the ancestry of the proposed dam');
    }

    return this.prisma.animal.update({
      where: { id },
      data: {
        ...animalData,
        ...(animalData.species && { species: animalData.species as Species }),
        ...(animalData.sex && { sex: animalData.sex as AnimalSex }),
        birthDate: animalData.birthDate ? parseDateString(animalData.birthDate) : undefined,
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

  private async isAncestorOf(potentialAncestorId: string, targetId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue = [targetId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = await this.prisma.animal.findUnique({
        where: { id: currentId },
        select: { sireId: true, damId: true },
      });
      if (!current) continue;

      if (current.sireId === potentialAncestorId || current.damId === potentialAncestorId) return true;
      if (current.sireId) queue.push(current.sireId);
      if (current.damId) queue.push(current.damId);
    }

    return false;
  }
}
