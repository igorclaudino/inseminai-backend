import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Relatórios')
@Controller('relatorios')
export class RelatoriosController {
  constructor(private relatoriosService: RelatoriosService) {}

  @Get('fazenda/:fazendaId')
  @ApiOperation({ summary: 'Relatório de desempenho geral da fazenda' })
  @ApiResponse({
    status: 200,
    description: 'Resumo estatístico de reprodução da fazenda',
    schema: {
      example: {
        fazenda: { id: 'fazenda-demo-001', nome: 'Fazenda São João' },
        resumo: {
          totalAnimais: 42,
          totalEventos: 120,
          prenhezes: 85,
          taxaGeralPrenhez: 71,
          mediaProbabilidadeIA: 74,
        },
        porEspecie: [
          { especie: 'bovino', quantidade: 35 },
          { especie: 'caprino', quantidade: 7 },
        ],
        distribuicaoRisco: { baixo: 12, moderado: 8, alto: 3 },
      },
    },
  })
  desempenhoFazenda(@Param('fazendaId') fazendaId: string, @UsuarioAtual() usuario: any) {
    return this.relatoriosService.desempenhoFazenda(fazendaId, usuario.id);
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: 'Relatório de desempenho reprodutivo de um animal' })
  @ApiResponse({
    status: 200,
    description: 'Histórico e indicadores reprodutivos do animal',
    schema: {
      example: {
        animal: { id: 'uuid', nome: 'Mimosa', especie: 'bovino', raca: 'Nelore', idadeMeses: 26, pesoKg: 385.5 },
        historico: {
          totalEventos: 5,
          prenhezes: 3,
          abortos: 0,
          partos: 2,
          taxaPrenhez: 75,
          intervaloMedioPartos: 365,
        },
        eventos: [
          { id: 'uuid', data: '2024-05-10', tipo: 'inseminacao_artificial', resultado: 'positivo' },
        ],
      },
    },
  })
  desempenhoAnimal(@Param('animalId') animalId: string, @UsuarioAtual() usuario: any) {
    return this.relatoriosService.desempenhoAnimal(animalId, usuario.id);
  }

  @Get('reprodutores/:fazendaId')
  @ApiOperation({ summary: 'Ranking de reprodutores por score de fertilidade' })
  @ApiResponse({
    status: 200,
    description: 'Reprodutores ordenados por scoreFertilidade (maior = melhor)',
    schema: {
      example: [
        {
          id: 'uuid',
          nome: 'Trovão do Sertão',
          especie: 'bovino',
          raca: 'Nelore',
          scoreFertilidade: 83,
          totalInseminacoes: 20,
          prenhezes: 15,
        },
      ],
    },
  })
  rankingReprodutores(@Param('fazendaId') fazendaId: string, @UsuarioAtual() usuario: any) {
    return this.relatoriosService.rankingReprodutores(fazendaId, usuario.id);
  }
}
