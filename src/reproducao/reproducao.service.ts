import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarEventoDto } from './dto/criar-evento.dto';
import { AtualizarDiagnosticoDto } from './dto/atualizar-diagnostico.dto';
import { paginar } from '../common/dto/paginacao.dto';
import { ReprodutoresService } from '../reprodutores/reprodutores.service';

@Injectable()
export class ReproducaoService {
  constructor(private prisma: PrismaService, private reprodutoresService: ReprodutoresService) {}

  async registrarEvento(dto: CriarEventoDto, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: dto.animalId },
      include: { fazenda: true },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const evento = await this.prisma.eventoReprodutivo.create({
      data: {
        animalId: dto.animalId,
        reprodutorId: dto.reprodutorId,
        tipoEvento: dto.tipoEvento,
        inseminador: dto.inseminador,
        semenUtilizado: dto.semenUtilizado,
        lote: dto.lote,
        protocoloReprodutivo: dto.protocoloReprodutivo,
        dataEvento: new Date(dto.dataEvento),
        observacoes: dto.observacoes,
        diagnosticoPrenhez: 'pendente',
      },
      include: { animal: { select: { id: true, nome: true, identificador: true } }, reprodutor: true },
    });

    // Atualiza status e dataUltimoParto conforme tipo do evento
    const statusMap: Record<string, string> = {
      inseminacao_artificial: 'Em Reprodução',
      monta_natural: 'Em Reprodução',
      monta_controlada: 'Em Reprodução',
      prenhez: 'Prenhe',
      parto: 'Apto',
      aborto: 'Apto',
    };

    const atualizacaoAnimal: Record<string, any> = {};
    if (statusMap[dto.tipoEvento]) {
      atualizacaoAnimal.statusReproducao = statusMap[dto.tipoEvento];
    }
    if (dto.tipoEvento === 'parto') {
      // Registra a data do parto — diasPosParto será calculado dinamicamente a partir daqui
      atualizacaoAnimal.dataUltimoParto = new Date(dto.dataEvento);
      atualizacaoAnimal.quantidadePartos = { increment: 1 };
    }
    if (dto.tipoEvento === 'aborto') {
      atualizacaoAnimal.quantidadeAbortos = { increment: 1 };
    }
    if (dto.tipoEvento === 'cio') {
      atualizacaoAnimal.quantidadeCiosDetectados = { increment: 1 };
    }

    if (Object.keys(atualizacaoAnimal).length > 0) {
      await this.prisma.animal.update({ where: { id: dto.animalId }, data: atualizacaoAnimal });
    }

    return evento;
  }

  async listar(
    fazendaId: string,
    usuarioId: string,
    filtros: { busca?: string; tipoAnimal?: string; diagnosticoPrenhez?: string; resultado?: string; inicio?: string; fim?: string },
    page = 1,
    limit = 20,
  ) {
    const fazenda = await this.prisma.fazenda.findUnique({ where: { id: fazendaId } });
    if (!fazenda) throw new NotFoundException('Fazenda não encontrada');
    if (fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const where = {
      animal: {
        fazendaId,
        ...(filtros.tipoAnimal && { especie: filtros.tipoAnimal }),
        ...(filtros.busca && {
          OR: [
            { nome: { contains: filtros.busca, mode: 'insensitive' as const } },
            { identificador: { contains: filtros.busca, mode: 'insensitive' as const } },
          ],
        }),
      },
      ...(filtros.diagnosticoPrenhez && { diagnosticoPrenhez: filtros.diagnosticoPrenhez }),
      ...(filtros.resultado && { resultado: filtros.resultado }),
      ...((filtros.inicio || filtros.fim) && {
        dataEvento: {
          ...(filtros.inicio && { gte: new Date(filtros.inicio) }),
          ...(filtros.fim && { lte: new Date(filtros.fim) }),
        },
      }),
    };

    const [eventos, total] = await Promise.all([
      this.prisma.eventoReprodutivo.findMany({
        where,
        include: {
          animal: { select: { id: true, nome: true, identificador: true, especie: true } },
          reprodutor: { select: { id: true, nome: true } },
          predicao: { select: { probabilidadePrenhez: true, nivelRisco: true } },
        },
        orderBy: { dataEvento: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.eventoReprodutivo.count({ where }),
    ]);

    return paginar(eventos, total, page, limit);
  }

  async listarPorAnimal(animalId: string, usuarioId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: { fazenda: true },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    if (animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    return this.prisma.eventoReprodutivo.findMany({
      where: { animalId },
      include: { reprodutor: { select: { id: true, nome: true } }, predicao: true },
      orderBy: { dataEvento: 'desc' },
    });
  }

  async atualizarDiagnostico(eventoId: string, dto: AtualizarDiagnosticoDto, usuarioId: string) {
    const evento = await this.prisma.eventoReprodutivo.findUnique({
      where: { id: eventoId },
      include: { animal: { include: { fazenda: true } } },
    });
    if (!evento) throw new NotFoundException('Evento não encontrado');
    if (evento.animal.fazenda.usuarioId !== usuarioId) throw new ForbiddenException();

    const eventoAtualizado = await this.prisma.eventoReprodutivo.update({
      where: { id: eventoId },
      data: {
        diagnosticoPrenhez: dto.diagnosticoPrenhez,
        resultado: dto.resultado,
        dataConfirmacao: dto.dataConfirmacao ? new Date(dto.dataConfirmacao) : new Date(),
      },
    });

    // Atualiza contadores e status do animal
    if (dto.diagnosticoPrenhez === 'positivo') {
      await this.prisma.animal.update({
        where: { id: evento.animalId },
        data: { historicoPrenhez: { increment: 1 }, statusReproducao: 'Prenhe' },
      });
      if (evento.reprodutorId) {
        await this.reprodutoresService.registrarResultadoInseminacao(evento.reprodutorId, true);
      }
    } else if (dto.diagnosticoPrenhez === 'negativo' || dto.diagnosticoPrenhez === 'falha_concepcao') {
      await this.prisma.animal.update({
        where: { id: evento.animalId },
        data: { statusReproducao: 'Apto' },
      });
      if (evento.reprodutorId) {
        await this.reprodutoresService.registrarResultadoInseminacao(evento.reprodutorId, false);
      }
    }

    return eventoAtualizado;
  }
}
