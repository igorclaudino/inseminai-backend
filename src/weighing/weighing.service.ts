import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeighingDto } from './dto/create-weighing.dto';

@Injectable()
export class WeighingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWeighingDto, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: dto.animalId } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    return this.prisma.weighing.create({
      data: {
        animalId: dto.animalId,
        weightKg: dto.weightKg,
        weighingDate: new Date(dto.weighingDate),
        notes: dto.notes,
      },
    });
  }

  async history(animalId: string, farmId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.farmId !== farmId) throw new NotFoundException('Animal not found');

    const weighings = await this.prisma.weighing.findMany({
      where: { animalId },
      orderBy: { weighingDate: 'desc' },
    });

    const latest = weighings[0] ?? null;
    const totalGain =
      weighings.length >= 2
        ? +(weighings[0].weightKg - weighings[weighings.length - 1].weightKg).toFixed(2)
        : null;

    return { latest, totalGain, history: weighings };
  }

  async remove(id: string, farmId: string) {
    const weighing = await this.prisma.weighing.findUnique({
      where: { id },
      include: { animal: true },
    });
    if (!weighing) throw new NotFoundException('Weighing record not found');
    if (weighing.animal.farmId !== farmId) throw new NotFoundException('Weighing record not found');
    return this.prisma.weighing.delete({ where: { id } });
  }
}
