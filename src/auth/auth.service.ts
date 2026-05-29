import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
    };
  }
}
