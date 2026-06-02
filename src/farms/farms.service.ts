import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto } from './dto/create-farm.dto';

@Injectable()
export class FarmsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFarmDto, userId: string) {
    const farm = await this.prisma.farm.create({
      data: { ...dto, ownerId: userId },
    });
    await this.prisma.farmMember.create({
      data: { farmId: farm.id, userId, role: 'admin' },
    });
    return farm;
  }

  async list(userId: string) {
    const memberships = await this.prisma.farmMember.findMany({
      where: { userId },
      select: { farmId: true, role: true },
    });

    const farmIds = memberships.map((m) => m.farmId);
    const roleMap = Object.fromEntries(memberships.map((m) => [m.farmId, m.role]));

    const farms = await this.prisma.farm.findMany({
      where: { id: { in: farmIds }, deletedAt: null },
      include: { _count: { select: { animals: true, members: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return farms.map((f) => ({ ...f, myRole: roleMap[f.id] }));
  }

  async getCurrent(farmId: string, memberRole: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId, deletedAt: null },
      include: { _count: { select: { animals: true, members: true } } },
    });
    if (!farm) throw new NotFoundException('Farm not found');
    return { ...farm, myRole: memberRole };
  }

  async update(farmId: string, dto: Partial<CreateFarmDto>) {
    return this.prisma.farm.update({ where: { id: farmId }, data: dto });
  }
}
