import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const { user, farm } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: dto.name, email: dto.email, password: hashedPassword },
      });
      const farm = await tx.farm.create({
        data: { name: `Fazenda de ${dto.name}`, ownerId: user.id },
      });
      await tx.farmMember.create({
        data: { farmId: farm.id, userId: user.id, role: 'admin' },
      });
      return { user, farm };
    });

    const access_token = this.jwt.sign({ sub: user.id, email: user.email });
    return {
      access_token,
      user: { id: user.id, name: user.name, email: user.email },
      farmId: farm.id,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const membership = await this.prisma.farmMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    const access_token = this.jwt.sign({ sub: user.id, email: user.email });
    return {
      access_token,
      user: { id: user.id, name: user.name, email: user.email },
      farmId: membership?.farmId ?? null,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    const { updatedUser, farm } = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { password: hashed, mustChangePassword: false },
      });

      // create farm on first password change (admin onboarding)
      let farm = null;
      if (user.mustChangePassword) {
        const hasFarm = await tx.farmMember.findFirst({ where: { userId } });
        if (!hasFarm) {
          farm = await tx.farm.create({
            data: { name: `Fazenda de ${user.name}`, ownerId: userId },
          });
          await tx.farmMember.create({
            data: { farmId: farm.id, userId, role: 'admin' },
          });
        }
      }

      return { updatedUser, farm };
    });

    const access_token = this.jwt.sign({ sub: updatedUser.id, email: updatedUser.email });
    return {
      access_token,
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email },
      farmId: farm?.id ?? null,
      mustChangePassword: false,
    };
  }
}
