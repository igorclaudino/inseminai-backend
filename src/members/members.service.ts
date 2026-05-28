import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async listMembers(farmId: string) {
    const members = await this.prisma.farmMember.findMany({
      where: { farmId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  async inviteMember(farmId: string, dto: InviteMemberDto, requesterId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      include: { owner: { select: { name: true } } },
    });

    const existingInvite = await this.prisma.farmInvitation.findFirst({
      where: { farmId, email: dto.email, status: 'pending' },
    });
    if (existingInvite) {
      throw new ConflictException('A pending invitation already exists for this email on this farm');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      const alreadyMember = await this.prisma.farmMember.findUnique({
        where: { farmId_userId: { farmId, userId: existingUser.id } },
      });
      if (alreadyMember) {
        throw new ConflictException('This user is already a member of this farm');
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.farmInvitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        farmId,
        invitedById: requesterId,
        expiresAt,
      },
    });

    const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/invitations/${invitation.token}`;

    const inviter = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { name: true },
    });

    await this.mail.sendFarmInvitation({
      toEmail: dto.email,
      farmName: farm!.name,
      role: dto.role,
      inviterName: inviter!.name,
      acceptUrl,
    });

    return {
      message: `Invitation sent to ${dto.email}`,
      invitationId: invitation.id,
      expiresAt,
    };
  }

  async updateMemberRole(farmId: string, memberId: string, dto: UpdateMemberRoleDto, requesterId: string) {
    const member = await this.prisma.farmMember.findFirst({
      where: { id: memberId, farmId },
    });
    if (!member) throw new NotFoundException('Member not found on this farm');
    if (member.userId === requesterId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const updated = await this.prisma.farmMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      id: updated.id,
      role: updated.role,
      user: updated.user,
    };
  }

  async removeMember(farmId: string, memberId: string, requesterId: string) {
    const member = await this.prisma.farmMember.findFirst({
      where: { id: memberId, farmId },
    });
    if (!member) throw new NotFoundException('Member not found on this farm');
    if (member.userId === requesterId) {
      throw new BadRequestException('You cannot remove yourself from the farm');
    }

    await this.prisma.farmMember.delete({ where: { id: memberId } });

    return { message: 'Member removed from farm' };
  }

  async listPendingInvitations(farmId: string) {
    const invitations = await this.prisma.farmInvitation.findMany({
      where: { farmId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
    }));
  }

  async cancelInvitation(farmId: string, invitationId: string) {
    const invitation = await this.prisma.farmInvitation.findFirst({
      where: { id: invitationId, farmId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    await this.prisma.farmInvitation.update({
      where: { id: invitationId },
      data: { status: 'expired' },
    });

    return { message: 'Invitation cancelled' };
  }
}
