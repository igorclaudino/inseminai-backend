import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarAnimalDto } from './dto/criar-animal.dto';
import { AtualizarAnimalDto } from './dto/atualizar-animal.dto';
import { paginar } from '../common/dto/paginacao.dto';
import { calcularDiasPosParto } from '../common/helpers/dias-pos-parto';

@Injectable()
export class AnimaisService {
  constructor(private prisma: PrismaService) {}

  async criar(dto: CriarAnimalDto, usuarioId: string) {
    await this.verificarFazenda(dto.fazendaId, usuarioId);
    const { pesoInicial, dataPesagemInicial, ...dadosAnimal } = dto;

    return this.prisma.animal.create({
      data: {
        ...dadosAnimal,
        dataNascimento: dadosAnimal.dataNascimento ? new Date(dadosAnimal.dataNascimento) : undefined,
        pesagens: pesoInicial
          ? { create: { pesoKg: pesoInicial, dataPesagem: dataPesagemInicial ? new Date(dataPesagemInicial) : new Date() } }
          : undefined,
      },
      include: { pesagens: { orderBy: { dataPesagem: 'desc' }, take: 1 } },
    });
  }

  async listar(
    fazendaId: string,
    usuarioId: string,
    filtros: { especie?: string; sexo?: string; raca?: string; busca?: string },
    page = 1,
    limit = 20,
  ) {
    await this.verificarFazenda(fazendaId, usuarioId);

    const where = {
      fazendaId,
      ativo: true,
      ...(filtros.especie && { especie: filtros.especie }),
      ...(filtros.sexo && { sexo: filtros.sexo }),
      ...(filtros.raca && { raca: filtros.raca }),
      ...(filtros.busca && {
        OR: [
          { nome: { contains: filtros.busca, mode: 'insensitive' as const } },
          { identificador: { contains: filtros.busca, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [animais, total] = await Promise.all([
      this.prisma.animal.findMany({
        where,
        include: {
          pesagens: { orderBy: { dataPesagem: 'desc' }, take: 1 },
          pai: { select: { id: true, nome: true, identificador: true } },
          mae: { select: { id: true, nome: true, identificador: true } },
          _count: { select: { eventosReprodutivos: true } },
        },
        orderBy: { identificador: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.animal.count({ where }),
    ]);

    const data = animais.map((a) => ({
      ...a,
      diasPosParto: calcularDiasPosParto(a.dataUltimoParto),
      pesoAtual: a.pesagens[0]?.pesoKg ?? null,
    }));

    return paginar(data, total, page, limit);
  }

  async buscarPorId(id: string, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      include: {
        fazenda: true,
        pai: { select: { id: true, nome: true, identificador: true } },
        mae: { select: { id: true, nome: true, identificador: true } },
        pesagens: { orderBy: { dataPesagem: 'desc' } },
        eventosReprodutivos: {
          include: { reprodutor: { select: { id: true, nome: true } } },
          orderBy: { dataEvento: 'desc' },
        },
        predicoes: { orderBy: { criadoEm: 'desc' }, take: 5 },
      },
    });

    if (!animal) throw new NotFoundException('Animal não encontrado');
    await this.verificarFazenda(animal.fazendaId, usuarioId);

    return {
      ...animal,
      diasPosParto: calcularDiasPosParto(animal.dataUltimoParto),
      pesoAtual: animal.pesagens[0]?.pesoKg ?? null,
    };
  }

  async atualizar(id: string, dto: AtualizarAnimalDto, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    await this.verificarFazenda(animal.fazendaId, usuarioId);

    const { pesoInicial, dataPesagemInicial, ...dadosAnimal } = dto;

    return this.prisma.animal.update({
      where: { id },
      data: {
        ...dadosAnimal,
        dataNascimento: dadosAnimal.dataNascimento ? new Date(dadosAnimal.dataNascimento) : undefined,
      },
    });
  }

  async remover(id: string, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    await this.verificarFazenda(animal.fazendaId, usuarioId);
    return this.prisma.animal.update({ where: { id }, data: { ativo: false } });
  }

  private async verificarFazenda(fazendaId: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();
  }
}
