import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function verifyFarmAccess(
  prisma: PrismaService,
  farmId: string,
  userId: string,
  requireAdmin = false,
): Promise<string> {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new NotFoundException('Farm not found');

  const membership = await prisma.farmMember.findUnique({
    where: { farmId_userId: { farmId, userId } },
  });
  if (!membership) throw new ForbiddenException('Access denied to this farm');

  if (requireAdmin && membership.role !== 'admin') {
    throw new ForbiddenException('Only administrators can perform this action');
  }

  return membership.role;
}
