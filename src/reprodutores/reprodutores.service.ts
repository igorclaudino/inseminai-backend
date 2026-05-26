import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarReprodutorDto } from './dto/criar-reprodutor.dto';
import { AtualizarReprodutorDto } from './dto/atualizar-reprodutor.dto';
import { paginar } from '../common/dto/paginacao.dto';
import { estimarScoreReprodutor, calcularScoreBlendado } from './score-reprodutor';

@Injectable()
export class ReprodutoresService {
  constructor(private prisma: PrismaService) {}

  async criar(dto: CriarReprodutorDto, usuarioId: string) {
    await this.verificarFazenda(dto.fazendaId, usuarioId);

    let { especie, nome, raca } = dto;

    if (dto.animalId) {
      const animal = await this.resolverAnimalVinculado(dto.animalId, dto.fazendaId);
      especie = animal.especie;
      raca = animal.raca;
      nome = dto.nome ?? animal.nome;
    }

    if (!especie || !raca || !nome) {
      throw new BadRequestException('especie, nome e raca são obrigatórios quando animalId não é informado');
    }

    const totalInseminacoes = dto.totalInseminacoes ?? 0;
    const prenhezes = dto.prenhezes ?? 0;

    const scoreEstimado = await estimarScoreReprodutor(especie, raca);
    const scoreFertilidade = calcularScoreBlendado(prenhezes, totalInseminacoes, scoreEstimado);

    return this.prisma.reprodutor.create({
      data: {
        especie,
        nome,
        raca,
        fazendaId: dto.fazendaId,
        totalInseminacoes,
        prenhezes,
        scoreEstimado,
        scoreFertilidade,
        ...(dto.animalId && { animalId: dto.animalId }),
      },
      include: { animal: { select: { id: true, identificador: true, dataNascimento: true, fotoUrl: true } } },
    });
  }

  async listar(fazendaId: string, usuarioId: string, especie?: string, page = 1, limit = 20) {
    await this.verificarFazenda(fazendaId, usuarioId);
    const where = { fazendaId, ativo: true, ...(especie && { especie }) };

    const [reprodutores, total] = await Promise.all([
      this.prisma.reprodutor.findMany({
        where,
        orderBy: { scoreFertilidade: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { animal: { select: { id: true, identificador: true, dataNascimento: true, fotoUrl: true } } },
      }),
      this.prisma.reprodutor.count({ where }),
    ]);

    return paginar(reprodutores, total, page, limit);
  }

  async buscarPorId(id: string, usuarioId: string) {
    const reprodutor = await this.prisma.reprodutor.findUnique({
      where: { id },
      include: {
        animal: { select: { id: true, identificador: true, dataNascimento: true, fotoUrl: true, pesagens: { orderBy: { dataPesagem: 'desc' }, take: 1 } } },
        _count: { select: { eventosReprodutivos: true } },
      },
    });
    if (!reprodutor) throw new NotFoundException('Reprodutor não encontrado');
    await this.verificarFazenda(reprodutor.fazendaId, usuarioId);
    return reprodutor;
  }

  async atualizar(id: string, dto: AtualizarReprodutorDto, usuarioId: string) {
    const reprodutor = await this.prisma.reprodutor.findUnique({ where: { id } });
    if (!reprodutor) throw new NotFoundException('Reprodutor não encontrado');
    await this.verificarFazenda(reprodutor.fazendaId, usuarioId);

    let especie = dto.especie ?? reprodutor.especie;
    let raca = dto.raca ?? reprodutor.raca;
    let animalId = reprodutor.animalId;

    // Vinculando ou trocando o animal
    if (dto.animalId !== undefined) {
      if (dto.animalId) {
        const animal = await this.resolverAnimalVinculado(dto.animalId, reprodutor.fazendaId);
        especie = animal.especie;
        raca = animal.raca;
        animalId = dto.animalId;
      } else {
        // dto.animalId === null → desvincula
        animalId = null;
      }
    }

    let scoreEstimado = reprodutor.scoreEstimado;
    if (raca !== reprodutor.raca) {
      scoreEstimado = await estimarScoreReprodutor(especie, raca);
    }

    const total = dto.totalInseminacoes ?? reprodutor.totalInseminacoes;
    const prenhezes = dto.prenhezes ?? reprodutor.prenhezes;

    return this.prisma.reprodutor.update({
      where: { id },
      data: {
        especie,
        raca,
        animalId,
        ...(dto.nome && { nome: dto.nome }),
        ...(dto.totalInseminacoes !== undefined && { totalInseminacoes: dto.totalInseminacoes }),
        ...(dto.prenhezes !== undefined && { prenhezes: dto.prenhezes }),
        scoreEstimado,
        scoreFertilidade: calcularScoreBlendado(prenhezes, total, scoreEstimado),
      },
      include: { animal: { select: { id: true, identificador: true, dataNascimento: true, fotoUrl: true } } },
    });
  }

  async remover(id: string, usuarioId: string) {
    const reprodutor = await this.prisma.reprodutor.findUnique({ where: { id } });
    if (!reprodutor) throw new NotFoundException('Reprodutor não encontrado');
    await this.verificarFazenda(reprodutor.fazendaId, usuarioId);
    return this.prisma.reprodutor.update({ where: { id }, data: { ativo: false } });
  }

  async registrarResultadoInseminacao(reprodutorId: string, prenhez: boolean) {
    await this.prisma.reprodutor.update({
      where: { id: reprodutorId },
      data: {
        totalInseminacoes: { increment: 1 },
        ...(prenhez && { prenhezes: { increment: 1 } }),
      },
    });

    const reprodutor = await this.prisma.reprodutor.findUnique({ where: { id: reprodutorId } });
    if (!reprodutor) return;

    await this.prisma.reprodutor.update({
      where: { id: reprodutorId },
      data: {
        scoreFertilidade: calcularScoreBlendado(
          reprodutor.prenhezes,
          reprodutor.totalInseminacoes,
          reprodutor.scoreEstimado,
        ),
      },
    });
  }

  private async resolverAnimalVinculado(animalId: string, fazendaId: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal vinculado não encontrado');
    if (animal.fazendaId !== fazendaId) throw new ForbiddenException('Animal não pertence à fazenda');
    if (animal.sexo !== 'macho') throw new BadRequestException('Apenas animais do sexo macho podem ser vinculados como reprodutor');
    return animal;
  }

  private async verificarFazenda(fazendaId: string, usuarioId: string) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();
  }
}
