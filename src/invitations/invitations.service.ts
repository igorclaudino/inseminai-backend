import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async getInvitation(token: string) {
    const invitation = await this.prisma.farmInvitation.findUnique({
      where: { token },
      include: {
        farm: { select: { id: true, name: true, city: true, state: true } },
        invitedBy: { select: { name: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitation not found or invalid');

    if (invitation.status === 'accepted') {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      if (invitation.status !== 'expired') {
        await this.prisma.farmInvitation.update({ where: { token }, data: { status: 'expired' } });
      }
      throw new BadRequestException('This invitation has expired');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      farm: invitation.farm,
      invitedBy: invitation.invitedBy.name,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.farmInvitation.findUnique({
      where: { token },
      include: { farm: { select: { name: true } } },
    });

    if (!invitation) throw new NotFoundException('Invitation not found or invalid');

    if (invitation.status === 'accepted') {
      throw new BadRequestException('This invitation has already been accepted');
    }

    if (invitation.status === 'expired' || invitation.expiresAt < new Date()) {
      await this.prisma.farmInvitation.update({ where: { token }, data: { status: 'expired' } });
      throw new BadRequestException('This invitation has expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email !== invitation.email) {
      throw new BadRequestException(
        `This invitation was sent to ${invitation.email}. Please log in with the correct email.`,
      );
    }

    const alreadyMember = await this.prisma.farmMember.findUnique({
      where: { farmId_userId: { farmId: invitation.farmId, userId } },
    });
    if (alreadyMember) {
      throw new BadRequestException('You are already a member of this farm');
    }

    await this.prisma.$transaction([
      this.prisma.farmMember.create({
        data: { farmId: invitation.farmId, userId, role: invitation.role },
      }),
      this.prisma.farmInvitation.update({
        where: { token },
        data: { status: 'accepted' },
      }),
    ]);

    return {
      message: `Welcome to farm ${invitation.farm.name}!`,
      farmId: invitation.farmId,
      role: invitation.role,
    };
  }
}
