import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarFazendaDto } from './dto/criar-fazenda.dto';

@Injectable()
export class FazendasService {
  constructor(private prisma: PrismaService) {}

  async criar(dto: CriarFazendaDto, usuarioId: string) {
    return this.prisma.fazenda.create({
      data: { ...dto, usuarioId },
    });
  }

  async listar(usuarioId: string) {
    return this.prisma.fazenda.findMany({
      where: { usuarioId },
      include: {
        _count: { select: { animais: true, reprodutores: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({
      where: { id },
      include: {
        _count: { select: { animais: true, reprodutores: true } },
      },
    });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();
    return fazenda;
  }

  async atualizar(id: string, dto: Partial<CriarFazendaDto>, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();
    return this.prisma.fazenda.update({ where: { id }, data: dto });
  }
}
