import { Injectable, CanActivate, ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FarmGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const farmId = request.headers['x-farm-id'] as string;
    const userId = request.user?.id;

    if (!farmId) throw new BadRequestException('X-Farm-ID header is required');

    const membership = await this.prisma.farmMember.findUnique({
      where: { farmId_userId: { farmId, userId } },
    });

    if (!membership) throw new ForbiddenException('Access denied to this farm');

    const requireAdmin = this.reflector.getAllAndOverride<boolean>('requireAdmin', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requireAdmin && membership.role !== 'admin') {
      throw new ForbiddenException('Only administrators can perform this action');
    }

    request.farmId = farmId;
    request.memberRole = membership.role;

    return true;
  }
}
