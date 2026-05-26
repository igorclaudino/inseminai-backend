import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IaService } from './ia.service';
import { PreverPrenhezDto } from './dto/prever-prenhez.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('IA')
@Controller('ia')
export class IaController {
  constructor(private iaService: IaService) {}

  @Post('prever-prenhez')
  @ApiOperation({ summary: 'Gerar predição de probabilidade de prenhez com análise de IA' })
  @ApiResponse({
    status: 201,
    description: 'Predição gerada',
    schema: {
      example: {
        probabilidadePrenhez: 78,
        scoreFertilidade: 83,
        nivelRisco: 'baixo',
        compatibilidadeGenetica: 88,
        fatoresPositivos: [
          'ECC adequado (4/5)',
          'Reprodutor com alto score de fertilidade (83)',
          'Sem histórico de doenças reprodutivas',
        ],
        alertas: ['Temperatura elevada pode reduzir taxa de concepção'],
        recomendacoes: [
          'Manter protocolo IATF conforme planejado',
          'Monitorar temperatura retal nas próximas 72h',
        ],
        insightGpt: 'Com base no histórico reprodutivo e nos indicadores atuais, a fêmea apresenta condições favoráveis para prenhez...',
        protocolo: 'IATF',
      },
    },
  })
  preverPrenhez(@Body() dto: PreverPrenhezDto, @UsuarioAtual() usuario: any) {
    return this.iaService.preverPrenhez(dto, usuario.id);
  }

  @Get('recomendar-reprodutor/:fazendaId/:animalId')
  @ApiOperation({ summary: 'Recomendar melhor reprodutor para um animal com base em compatibilidade genética' })
  @ApiResponse({
    status: 200,
    description: 'Lista de reprodutores rankeados por compatibilidade',
    schema: {
      example: [
        {
          reprodutor: { id: 'uuid', nome: 'Trovão do Sertão', raca: 'Nelore', scoreFertilidade: 83 },
          compatibilidadeGenetica: 90,
          justificativa: 'Alta compatibilidade genética. Raças Nelore × Nelore apresentam boa adaptação ao semiárido.',
        },
      ],
    },
  })
  recomendarReprodutor(
    @Param('fazendaId') fazendaId: string,
    @Param('animalId') animalId: string,
    @UsuarioAtual() usuario: any,
  ) {
    return this.iaService.recomendarReprodutor(fazendaId, animalId, usuario.id);
  }

  @Get('historico/fazenda/:fazendaId')
  @ApiOperation({ summary: 'Histórico geral de predições da fazenda (paginado)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de predições com dados do animal',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            probabilidadePrenhez: 78,
            nivelRisco: 'baixo',
            protocolo: 'IATF',
            criadoEm: '2024-05-20T12:00:00.000Z',
            animal: { id: 'uuid', nome: 'Mimosa', identificador: 'BOV-2024-001', especie: 'bovino', raca: 'Nelore' },
          },
        ],
        total: 15,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  historicoFazenda(
    @Param('fazendaId') fazendaId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @UsuarioAtual() usuario: any,
  ) {
    return this.iaService.historicoFazenda(fazendaId, usuario.id, page ? +page : 1, limit ? +limit : 20);
  }

  @Get('historico/:animalId')
  @ApiOperation({ summary: 'Histórico de predições de um animal específico' })
  @ApiResponse({
    status: 200,
    description: 'Lista de predições geradas para o animal',
    schema: {
      example: [
        {
          id: 'uuid',
          probabilidadePrenhez: 78,
          nivelRisco: 'baixo',
          criadoEm: '2024-05-20T12:00:00.000Z',
        },
      ],
    },
  })
  historico(@Param('animalId') animalId: string, @UsuarioAtual() usuario: any) {
    return this.iaService.historicoPredicoes(animalId, usuario.id);
  }
}
