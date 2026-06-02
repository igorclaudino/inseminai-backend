import { ConflictException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class BackofficeService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async createAdmin(dto: CreateAdminDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail already registered');

    const tempPassword = this.generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        mustChangePassword: true,
      },
    });

    await this.mail.sendTempPassword({
      toEmail: dto.email,
      name: dto.name,
      tempPassword,
    });

    return {
      message: `Admin account created. Temporary password sent to ${dto.email}.`,
      userId: user.id,
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = randomBytes(12);
    return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
  }
}
