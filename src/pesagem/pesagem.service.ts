import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarPesagemDto } from './dto/criar-pesagem.dto';

@Injectable()
export class PesagemService {
  constructor(private prisma: PrismaService) {}

  async registrar(dto: CriarPesagemDto, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      include: { fazenda: true },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    return this.prisma.pesagem.create({
      data: {
        animalId: dto.animalId,
        pesoKg: dto.pesoKg,
        dataPesagem: new Date(dto.dataPesagem),
        observacoes: dto.observacoes,
      },
    });
  }

  async historico(animalId: string, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: { fazenda: true },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const pesagens = await this.prisma.pesagem.findMany({
      where: { animalId },
      orderBy: { dataPesagem: 'desc' },
    });

    const ultima = pesagens[0] ?? null;
    const ganhoTotal =
      pesagens.length >= 2
        ? +(pesagens[0].pesoKg - pesagens[pesagens.length - 1].pesoKg).toFixed(2)
        : null;

    return { ultima, ganhoTotal, historico: pesagens };
  }

  async remover(id: string, usuarioId: string) {
    const pesagem = await this.prisma.pesagem.findUnique({
      where: { id },
      include: { animal: { include: { fazenda: true } } },
    });
    if (!pesagem) throw new NotFoundException('Pesagem não encontrada');
    if (pesagem.animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();
    return this.prisma.pesagem.delete({ where: { id } });
  }
}
