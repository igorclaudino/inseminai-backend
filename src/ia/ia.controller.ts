import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IaService } from './ia.service';
import { PreverPrenhezDto } from './dto/prever-prenhez.dto';
import { AtualizarPerfilIaDto } from './dto/atualizar-perfil-ia.dto';
import { MelhorMatrizDto } from './dto/melhor-matriz.dto';
import { RecomendarReprodutorDto } from './dto/recomendar-reprodutor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('IA')
@Controller('ia')
export class IaController {
  constructor(private iaService: IaService) {}

  // ── Predição de prenhez ────────────────────────────────────────────────────

  @Post('prever-prenhez')
  @ApiOperation({
    summary: 'Gerar predição de probabilidade de prenhez com análise de IA',
    description:
      'Calcula a probabilidade de prenhez com base em 11 fatores zootécnicos e gera um insight de IA ' +
      'conforme o perfil configurado na fazenda (Essencial / Padrão / Especialista). ' +
      'O campo `perfilIaOverride` permite sobrescrever o perfil da fazenda em uma análise específica.',
  })
  @ApiResponse({
    status: 201,
    description: 'Predição gerada com sucesso',
    schema: {
      example: {
        probabilidadePrenhez: 81,
        scoreFertilidade: 76,
        nivelRisco: 'baixo',
        compatibilidadeGenetica: 88,
        fatoresPositivos: ['Peso adequado (425 kg)', 'Reprodutor com alta fertilidade (score 83)'],
        alertas: ['Temperatura elevada (35°C) — risco de estresse térmico'],
        recomendacoes: ['Realizar inseminação no período mais fresco do dia', 'Monitorar prenhez em 30 dias'],
        insightGpt: 'Animal apresenta boa condição reprodutiva com histórico favorável...',
        protocolo: 'IATF',
        _meta: {
          perfilIa: 'padrao',
          perfilNome: 'Padrão',
          tokensEntrada: 48,
          tokensSaida: 72,
          tokensTotal: 120,
        },
      },
    },
  })
  preverPrenhez(@Body() dto: PreverPrenhezDto, @UsuarioAtual() usuario: any) {
    return this.iaService.preverPrenhez(dto, usuario.id);
  }

  // ── Perfis de IA ──────────────────────────────────────────────────────────

  @Get('perfis')
  @ApiOperation({
    summary: 'Listar perfis de análise de IA disponíveis',
    description:
      'Retorna os três perfis disponíveis (Essencial, Padrão, Especialista) com suas características, ' +
      'latências estimadas e custo estimado por análise. Use esta rota para preencher a tela de configuração no frontend.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfis disponíveis',
    schema: {
      example: [
        {
          id: 'essencial',
          nome: 'Essencial',
          icone: '⚡',
          resumo: 'Resultado rápido, sem análise narrativa',
          descricao: 'Resultado imediato gerado diretamente pelos dados do rebanho...',
          melhorPara: ['Consultas rápidas no campo', 'Avaliações em lote'],
          latenciaEstimada: '< 200 ms',
          tokensEstimadosPorAnalise: 0,
          custoEstimadoPor1000Analises: { usd: 0, brl: 0 },
        },
        {
          id: 'padrao',
          nome: 'Padrão',
          icone: '📋',
          resumo: 'Resumo da IA em linguagem simples',
          tokensEstimadosPorAnalise: 130,
          custoEstimadoPor1000Analises: { usd: 0.056, brl: 0.32 },
        },
        {
          id: 'especialista',
          nome: 'Especialista',
          icone: '🔬',
          resumo: 'Laudo detalhado com análise aprofundada',
          tokensEstimadosPorAnalise: 380,
          custoEstimadoPor1000Analises: { usd: 0.17, brl: 0.97 },
        },
      ],
    },
  })
  listarPerfis() {
    return this.iaService.listarPerfis();
  }

  // ── Configuração de IA por fazenda (tenant) ───────────────────────────────

  @Get('config/:fazendaId')
  @ApiOperation({
    summary: 'Obter configuração de IA da fazenda',
    description:
      'Retorna o perfil de IA atualmente configurado para a fazenda (tenant) ' +
      'junto com a lista completa de perfis disponíveis para seleção.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuração atual da fazenda',
    schema: {
      example: {
        fazendaId: 'fazenda-demo-001',
        fazendaNome: 'Fazenda São João',
        perfilAtual: {
          id: 'padrao',
          nome: 'Padrão',
          icone: '📋',
          resumo: 'Resumo da IA em linguagem simples',
        },
        perfisDisponiveis: [],
      },
    },
  })
  obterConfigIa(@Param('fazendaId') fazendaId: string, @UsuarioAtual() usuario: any) {
    return this.iaService.obterConfigIa(fazendaId, usuario.id);
  }

  @Patch('config/:fazendaId')
  @ApiOperation({
    summary: 'Atualizar perfil de IA da fazenda',
    description:
      'Define o perfil de análise de IA que será usado por padrão em todas as predições desta fazenda. ' +
      'Valores aceitos: `essencial`, `padrao`, `especialista`.',
  })
  @ApiBody({ type: AtualizarPerfilIaDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      example: {
        mensagem: 'Perfil atualizado para "Especialista" com sucesso.',
        fazendaId: 'fazenda-demo-001',
        perfilAtual: { id: 'especialista', nome: 'Especialista', icone: '🔬', resumo: 'Laudo detalhado com análise aprofundada' },
      },
    },
  })
  atualizarConfigIa(
    @Param('fazendaId') fazendaId: string,
    @Body() dto: AtualizarPerfilIaDto,
    @UsuarioAtual() usuario: any,
  ) {
    return this.iaService.atualizarConfigIa(fazendaId, dto, usuario.id);
  }

  // ── Relatório de consumo de tokens ────────────────────────────────────────

  @Get('relatorio-consumo/:fazendaId')
  @ApiOperation({
    summary: 'Relatório de consumo de tokens de IA da fazenda',
    description:
      'Exibe o consumo real de tokens agrupado por perfil, custo acumulado, economia gerada em relação ' +
      'ao modo mais completo e projeções de custo para planejamento. ' +
      'Útil para demonstrar viabilidade econômica da solução.',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório completo de consumo de tokens e custo',
    schema: {
      example: {
        fazenda: { id: 'fazenda-demo-001', nome: 'Fazenda São João', perfilAtual: 'padrao' },
        resumo: {
          totalAnalises: 42,
          totalTokensConsumidos: 5460,
          custoRealAcumulado: { usd: 0.00305, brl: 0.0174 },
          economiaVsEspecialistaTotal: { usd: 0.00411, brl: 0.0234, percentual: 57.4 },
        },
        porPerfil: [
          {
            perfilId: 'essencial',
            perfilNome: 'Essencial',
            totalAnalises: 10,
            percentualUso: 23.8,
            tokens: { mediaRealPorAnalise: 0, estimadoPorAnalise: 0, totalConsumido: 0 },
            custo: { totalUsd: 0, totalBrl: 0, estimadoPor1000AnalisesBrl: 0 },
          },
        ],
        projecoesCusto: [
          { perfilId: 'essencial', perfilNome: 'Essencial', para100AnalisesBrl: 0, para1000AnalisesBrl: 0, para10000AnalisesBrl: 0 },
          { perfilId: 'padrao', perfilNome: 'Padrão', para100AnalisesBrl: 0.03, para1000AnalisesBrl: 0.32, para10000AnalisesBrl: 3.2 },
          { perfilId: 'especialista', perfilNome: 'Especialista', para100AnalisesBrl: 0.1, para1000AnalisesBrl: 0.97, para10000AnalisesBrl: 9.7 },
        ],
        _nota: 'Custo calculado com base em GPT-4o-mini...',
      },
    },
  })
  relatorioConsumo(@Param('fazendaId') fazendaId: string, @UsuarioAtual() usuario: any) {
    return this.iaService.relatorioConsumo(fazendaId, usuario.id);
  }

  // ── Melhor Reprodutor ─────────────────────────────────────────────────────

  @Get('recomendar-reprodutor/:fazendaId/:animalId')
  @ApiOperation({
    summary: 'Melhor Reprodutor — rankeia reprodutores por compatibilidade com a fêmea',
    description:
      'Calcula compatibilidade genética e de fertilidade entre a fêmea e todos os reprodutores ativos da fazenda. ' +
      'Gera insight de IA conforme o perfil configurado. O resultado é salvo no histórico de análises.',
  })
  @ApiQuery({ name: 'perfilIaOverride', required: false, enum: ['essencial', 'resumido', 'padrao', 'especialista'] })
  @ApiResponse({
    status: 200,
    description: 'Ranking de reprodutores com insight de IA',
    schema: {
      example: {
        animal: { id: 'uuid', nome: 'Mimosa', especie: 'bovino', raca: 'Nelore', pesoAtual: 445, scoreCondicaoCorporal: 4 },
        ranking: [
          { posicao: 1, reprodutor: { nome: 'Imperador', raca: 'Nelore', scoreFertilidade: 85, taxaRealPrenhez: null }, compatibilidade: 88, classificacao: 'Excelente', melhorEscolha: true },
          { posicao: 2, reprodutor: { nome: 'Trovão', raca: 'Angus', scoreFertilidade: 78, taxaRealPrenhez: 72 }, compatibilidade: 83, classificacao: 'Muito Bom', melhorEscolha: false },
        ],
        insightGpt: 'O Imperador apresenta a maior compatibilidade genética...',
        _meta: { perfilIa: 'padrao', perfilNome: 'Padrão', tokensEntrada: 82, tokensSaida: 65, tokensTotal: 147 },
      },
    },
  })
  recomendarReprodutor(
    @Param('fazendaId') fazendaId: string,
    @Param('animalId') animalId: string,
    @Query() dto: RecomendarReprodutorDto,
    @UsuarioAtual() usuario: any,
  ) {
    return this.iaService.recomendarReprodutor(fazendaId, animalId, dto, usuario.id);
  }

  // ── Melhor Matriz ─────────────────────────────────────────────────────────

  @Get('melhor-matriz/:fazendaId')
  @ApiOperation({
    summary: 'Melhor Matriz — rankeia fêmeas do rebanho prontas para inseminação',
    description:
      'Avalia todas as fêmeas elegíveis da fazenda (exceto Prenhe/Inativo/Descarte) usando o mesmo ' +
      'modelo de scoring de 11 fatores e retorna um ranking das mais aptas para inseminação agora. ' +
      'Gera insight de IA conforme o perfil configurado. O resultado é salvo no histórico de análises.',
  })
  @ApiQuery({ name: 'especie', required: false, enum: ['bovino', 'ovino', 'caprino'] })
  @ApiQuery({ name: 'protocolo', required: false, example: 'IATF' })
  @ApiQuery({ name: 'temperaturaAmbiente', required: false, example: 28 })
  @ApiQuery({ name: 'estacaoAno', required: false, enum: ['seca', 'chuvosa'] })
  @ApiQuery({ name: 'limite', required: false, example: 5, description: 'Número de animais no ranking (máx 20)' })
  @ApiQuery({ name: 'perfilIaOverride', required: false, enum: ['essencial', 'resumido', 'padrao', 'especialista'] })
  @ApiResponse({
    status: 200,
    description: 'Ranking das melhores fêmeas para inseminação com insight de IA',
    schema: {
      example: {
        fazenda: { id: 'fazenda-demo-001', nome: 'Fazenda São João' },
        parametros: { protocolo: 'IATF', temperaturaAmbiente: 28, estacaoAno: 'chuvosa', especie: 'todas' },
        totalAnimaisAvaliados: 7,
        ranking: [
          { posicao: 1, animal: { nome: 'Mimosa', especie: 'bovino', raca: 'Nelore', scoreCondicaoCorporal: 4 }, pesoAtual: 445, probabilidadePrenhez: 95, scoreFertilidade: 100, nivelRisco: 'baixo', melhorEscolha: true },
          { posicao: 2, animal: { nome: 'Branca', especie: 'ovino', raca: 'Santa Inês' }, pesoAtual: 52, probabilidadePrenhez: 89, scoreFertilidade: 90, nivelRisco: 'baixo', melhorEscolha: false },
        ],
        insightGpt: 'As três melhores matrizes apresentam peso e ECC adequados...',
        _meta: { perfilIa: 'padrao', perfilNome: 'Padrão', tokensEntrada: 95, tokensSaida: 74, tokensTotal: 169 },
      },
    },
  })
  melhorMatriz(
    @Param('fazendaId') fazendaId: string,
    @Query() dto: MelhorMatrizDto,
    @UsuarioAtual() usuario: any,
  ) {
    return this.iaService.melhorMatriz(fazendaId, dto, usuario.id);
  }

  // ── Histórico de predições ────────────────────────────────────────────────

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
            perfilIa: 'padrao',
            tokensEntrada: 48,
            tokensSaida: 72,
            criadoEm: '2026-05-22T12:00:00.000Z',
            animal: { id: 'uuid', nome: 'Mimosa', identificador: 'BOV-001', especie: 'bovino', raca: 'Nelore' },
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
          perfilIa: 'padrao',
          tokensEntrada: 48,
          tokensSaida: 72,
          criadoEm: '2026-05-22T12:00:00.000Z',
        },
      ],
    },
  })
  historico(@Param('animalId') animalId: string, @UsuarioAtual() usuario: any) {
    return this.iaService.historicoPredicoes(animalId, usuario.id);
  }
}
