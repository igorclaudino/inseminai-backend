import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

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

    const { updatedUser, farmId } = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { password: hashed, mustChangePassword: false },
      });

      // resolve farm on first password change
      let farmId: string | null = null;
      if (user.mustChangePassword) {
        const existingMembership = await tx.farmMember.findFirst({
          where: { userId },
          orderBy: { joinedAt: 'asc' },
        });
        if (existingMembership) {
          // invited user already has a farm
          farmId = existingMembership.farmId;
        } else {
          // backoffice admin: create farm now
          const farm = await tx.farm.create({
            data: { name: `Fazenda de ${user.name}`, ownerId: userId },
          });
          await tx.farmMember.create({
            data: { farmId: farm.id, userId, role: 'admin' },
          });
          farmId = farm.id;
        }
      }

      return { updatedUser, farmId };
    });

    const access_token = this.jwt.sign({ sub: updatedUser.id, email: updatedUser.email });
    return {
      access_token,
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email },
      farmId,
      mustChangePassword: false,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const genericResponse = { message: 'If this e-mail is registered, you will receive a reset link shortly.' };

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return genericResponse;

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;

    await this.mail.sendPasswordReset({ toEmail: user.email, name: user.name, resetUrl });

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: dto.token },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }
}
