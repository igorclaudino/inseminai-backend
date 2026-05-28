import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBreederDto } from './dto/create-breeder.dto';
import { UpdateBreederDto } from './dto/update-breeder.dto';
import { paginate } from '../common/dto/pagination.dto';
import { estimateBreederScore, calcBlendedScore } from './breeder-score';

@Injectable()
export class BreedersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBreederDto, farmId: string) {
    let { species, name, breed } = dto;

    if (dto.animalId) {
      const animal = await this.resolveLinkedAnimal(dto.animalId, farmId);
      species = animal.species;
      breed = animal.breed;
      name = dto.name ?? animal.name;
    }

    if (!species || !breed || !name) {
      throw new BadRequestException('species, name and breed are required when animalId is not provided');
    }

    const totalInseminations = dto.totalInseminations ?? 0;
    const pregnancies = dto.pregnancies ?? 0;

    const estimatedScore = await estimateBreederScore(species, breed);
    const fertilityScore = calcBlendedScore(pregnancies, totalInseminations, estimatedScore);

    return this.prisma.breeder.create({
      data: {
        species, name, breed, farmId,
        totalInseminations, pregnancies,
        estimatedScore, fertilityScore,
        ...(dto.animalId && { animalId: dto.animalId }),
      },
      include: { animal: { select: { id: true, identifier: true, birthDate: true, photoUrl: true } } },
    });
  }

  async list(farmId: string, species?: string, page = 1, limit = 20) {
    const where = { farmId, active: true, ...(species && { species }) };

    const [breeders, total] = await Promise.all([
      this.prisma.breeder.findMany({
        where,
        orderBy: { fertilityScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { animal: { select: { id: true, identifier: true, birthDate: true, photoUrl: true } } },
      }),
      this.prisma.breeder.count({ where }),
    ]);

    return paginate(breeders, total, page, limit);
  }

  async findById(id: string, farmId: string) {
    const breeder = await this.prisma.breeder.findUnique({
      where: { id },
      include: {
        animal: { select: { id: true, identifier: true, birthDate: true, photoUrl: true, weighings: { orderBy: { weighingDate: 'desc' }, take: 1 } } },
        _count: { select: { reproductiveEvents: true } },
      },
    });
    if (!breeder) throw new NotFoundException('Breeder not found');
    if (breeder.farmId !== farmId) throw new NotFoundException('Breeder not found');
    return breeder;
  }

  async update(id: string, dto: UpdateBreederDto, farmId: string) {
    const breeder = await this.prisma.breeder.findUnique({ where: { id } });
    if (!breeder) throw new NotFoundException('Breeder not found');
    if (breeder.farmId !== farmId) throw new NotFoundException('Breeder not found');

    let species = dto.species ?? breeder.species;
    let breed = dto.breed ?? breeder.breed;
    let animalId = breeder.animalId;

    if (dto.animalId !== undefined) {
      if (dto.animalId) {
        const animal = await this.resolveLinkedAnimal(dto.animalId, farmId);
        species = animal.species;
        breed = animal.breed;
        animalId = dto.animalId;
      } else {
        animalId = null;
      }
    }

    let estimatedScore = breeder.estimatedScore;
    if (breed !== breeder.breed) {
      estimatedScore = await estimateBreederScore(species, breed);
    }

    const total = dto.totalInseminations ?? breeder.totalInseminations;
    const pregnancies = dto.pregnancies ?? breeder.pregnancies;

    return this.prisma.breeder.update({
      where: { id },
      data: {
        species, breed, animalId,
        ...(dto.name && { name: dto.name }),
        ...(dto.totalInseminations !== undefined && { totalInseminations: dto.totalInseminations }),
        ...(dto.pregnancies !== undefined && { pregnancies: dto.pregnancies }),
        estimatedScore,
        fertilityScore: calcBlendedScore(pregnancies, total, estimatedScore),
      },
      include: { animal: { select: { id: true, identifier: true, birthDate: true, photoUrl: true } } },
    });
  }

  async remove(id: string, farmId: string) {
    const breeder = await this.prisma.breeder.findUnique({ where: { id } });
    if (!breeder) throw new NotFoundException('Breeder not found');
    if (breeder.farmId !== farmId) throw new NotFoundException('Breeder not found');
    return this.prisma.breeder.update({ where: { id }, data: { active: false, deletedAt: new Date() } });
  }

  async recordInseminationResult(breederId: string, pregnancy: boolean) {
    await this.prisma.breeder.update({
      where: { id: breederId },
      data: {
        totalInseminations: { increment: 1 },
        ...(pregnancy && { pregnancies: { increment: 1 } }),
      },
    });

    const breeder = await this.prisma.breeder.findUnique({ where: { id: breederId } });
    if (!breeder) return;

    await this.prisma.breeder.update({
      where: { id: breederId },
      data: { fertilityScore: calcBlendedScore(breeder.pregnancies, breeder.totalInseminations, breeder.estimatedScore) },
    });
  }

  private async resolveLinkedAnimal(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Linked animal not found');
    if (animal.farmId !== farmId) throw new BadRequestException('Animal does not belong to this farm');
    if (animal.sex !== 'male') throw new BadRequestException('Only male animals can be linked as breeders');
    return animal;
  }
}
