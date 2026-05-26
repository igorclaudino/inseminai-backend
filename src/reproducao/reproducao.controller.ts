import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReproducaoService } from './reproducao.service';
import { CriarEventoDto } from './dto/criar-evento.dto';
import { AtualizarDiagnosticoDto } from './dto/atualizar-diagnostico.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Reprodução')
@Controller('reproducao')
export class ReproducaoController {
  constructor(private reproducaoService: ReproducaoService) {}

  @Post('evento')
  @ApiOperation({ summary: 'Registrar evento reprodutivo (inseminação, parto, cio, aborto, etc.)' })
  @ApiResponse({
    status: 201,
    description: 'Evento registrado. Para partos, atualiza diasPosParto automaticamente.',
    schema: {
      example: {
        id: 'uuid',
        animalId: 'animal-uuid',
        reprodutorId: 'reprodutor-uuid',
        tipoEvento: 'inseminacao_artificial',
        inseminador: 'Dr. Carlos Veterinário',
        semenUtilizado: 'Sêmen Nelore Premium Lote X-42',
        dataEvento: '2024-05-10T00:00:00.000Z',
        diagnosticoPrenhez: 'pendente',
      },
    },
  })
  registrarEvento(@Body() dto: CriarEventoDto, @UsuarioAtual() usuario: any) {
    return this.reproducaoService.registrarEvento(dto, usuario.id);
  }

  @Get('fazenda/:fazendaId')
  @ApiOperation({ summary: 'Listar eventos reprodutivos da fazenda com filtros e paginação' })
  @ApiQuery({ name: 'busca', required: false, description: 'Busca por nome ou identificador do animal' })
  @ApiQuery({ name: 'tipoAnimal', required: false, enum: ['bovino', 'ovino', 'caprino'] })
  @ApiQuery({ name: 'diagnosticoPrenhez', required: false, enum: ['pendente', 'positivo', 'negativo', 'falha_concepcao'] })
  @ApiQuery({ name: 'resultado', required: false })
  @ApiQuery({ name: 'inicio', required: false, description: 'Data inicial (ISO 8601)', example: '2024-01-01' })
  @ApiQuery({ name: 'fim', required: false, description: 'Data final (ISO 8601)', example: '2024-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de eventos',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            tipoEvento: 'inseminacao_artificial',
            dataEvento: '2024-05-10T00:00:00.000Z',
            diagnosticoPrenhez: 'positivo',
            animal: { id: 'uuid', nome: 'Mimosa', identificador: 'BOV-2024-001' },
            reprodutor: { id: 'uuid', nome: 'Trovão do Sertão' },
          },
        ],
        total: 15,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  listar(
    @Param('fazendaId') fazendaId: string,
    @Query('busca') busca: string,
    @Query('tipoAnimal') tipoAnimal: string,
    @Query('diagnosticoPrenhez') diagnosticoPrenhez: string,
    @Query('resultado') resultado: string,
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @UsuarioAtual() usuario: any,
  ) {
    return this.reproducaoService.listar(
      fazendaId,
      usuario.id,
      { busca, tipoAnimal, diagnosticoPrenhez, resultado, inicio, fim },
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: 'Listar eventos reprodutivos de um animal específico' })
  @ApiResponse({ status: 200, description: 'Histórico reprodutivo do animal' })
  listarPorAnimal(@Param('animalId') animalId: string, @UsuarioAtual() usuario: any) {
    return this.reproducaoService.listarPorAnimal(animalId, usuario.id);
  }

  @Patch('evento/:id/diagnostico')
  @ApiOperation({ summary: 'Atualizar diagnóstico de prenhez de um evento' })
  @ApiResponse({
    status: 200,
    description: 'Diagnóstico atualizado. Para prenhez positiva/negativa, atualiza o scoreFertilidade do reprodutor automaticamente.',
    schema: {
      example: {
        id: 'uuid',
        diagnosticoPrenhez: 'positivo',
        resultado: 'Confirmado por ultrassonografia aos 30 dias',
        dataConfirmacao: '2024-06-10T00:00:00.000Z',
      },
    },
  })
  atualizarDiagnostico(
    @Param('id') id: string,
    @Body() dto: AtualizarDiagnosticoDto,
    @UsuarioAtual() usuario: any,
  ) {
    return this.reproducaoService.atualizarDiagnostico(id, dto, usuario.id);
  }
}
