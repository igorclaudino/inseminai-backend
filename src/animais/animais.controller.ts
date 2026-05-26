import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AnimaisService } from './animais.service';
import { CriarAnimalDto } from './dto/criar-animal.dto';
import { AtualizarAnimalDto } from './dto/atualizar-animal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Animais')
@Controller('animais')
export class AnimaisController {
  constructor(private animaisService: AnimaisService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo animal' })
  @ApiResponse({
    status: 201,
    description: 'Animal cadastrado com sucesso',
    schema: {
      example: {
        id: 'uuid-gerado',
        identificador: 'BOV-2024-001',
        especie: 'bovino',
        nome: 'Mimosa',
        raca: 'Nelore',
        sexo: 'femea',
        statusReproducao: 'Apto',
        diasPosParto: 0,
        pesoAtual: 380,
        criadoEm: '2024-05-20T12:00:00.000Z',
      },
    },
  })
  criar(@Body() dto: CriarAnimalDto, @UsuarioAtual() usuario: any) {
    return this.animaisService.criar(dto, usuario.id);
  }

  @Get('fazenda/:fazendaId')
  @ApiOperation({ summary: 'Listar animais da fazenda com filtros e paginação' })
  @ApiQuery({ name: 'especie', required: false, enum: ['bovino', 'ovino', 'caprino'] })
  @ApiQuery({ name: 'sexo', required: false, enum: ['macho', 'femea'] })
  @ApiQuery({ name: 'raca', required: false, example: 'Nelore' })
  @ApiQuery({ name: 'busca', required: false, description: 'Busca por nome ou identificador' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de animais',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            identificador: 'BOV-2024-001',
            nome: 'Mimosa',
            especie: 'bovino',
            raca: 'Nelore',
            sexo: 'femea',
            statusReproducao: 'Apto',
            diasPosParto: 45,
            pesoAtual: 385.5,
          },
        ],
        total: 42,
        page: 1,
        limit: 20,
        totalPages: 3,
      },
    },
  })
  listar(
    @Param('fazendaId') fazendaId: string,
    @Query('especie') especie: string,
    @Query('sexo') sexo: string,
    @Query('raca') raca: string,
    @Query('busca') busca: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @UsuarioAtual() usuario: any,
  ) {
    return this.animaisService.listar(
      fazendaId,
      usuario.id,
      { especie, sexo, raca, busca },
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar animal por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados completos do animal',
    schema: {
      example: {
        id: 'uuid',
        identificador: 'BOV-2024-001',
        nome: 'Mimosa',
        especie: 'bovino',
        raca: 'Nelore',
        linhagem: 'Linha A',
        sexo: 'femea',
        dataNascimento: '2022-03-15T00:00:00.000Z',
        statusReproducao: 'Apto',
        diasPosParto: 45,
        pesoAtual: 385.5,
        historicoPrenhez: 3,
        quantidadePartos: 2,
        quantidadeAbortos: 0,
        scoreCondicaoCorporal: 4,
        pesagens: [],
        eventosReprodutivos: [],
        predicoes: [],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Animal não encontrado' })
  buscarPorId(@Param('id') id: string, @UsuarioAtual() usuario: any) {
    return this.animaisService.buscarPorId(id, usuario.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar dados do animal' })
  @ApiResponse({ status: 200, description: 'Animal atualizado' })
  atualizar(@Param('id') id: string, @Body() dto: AtualizarAnimalDto, @UsuarioAtual() usuario: any) {
    return this.animaisService.atualizar(id, dto, usuario.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativar animal (soft delete)' })
  @ApiResponse({ status: 200, description: 'Animal inativado' })
  remover(@Param('id') id: string, @UsuarioAtual() usuario: any) {
    return this.animaisService.remover(id, usuario.id);
  }
}
