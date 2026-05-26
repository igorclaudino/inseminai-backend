import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReprodutoresService } from './reprodutores.service';
import { CriarReprodutorDto } from './dto/criar-reprodutor.dto';
import { AtualizarReprodutorDto } from './dto/atualizar-reprodutor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Reprodutores')
@Controller('reprodutores')
export class ReprodutoresController {
  constructor(private reprodutoresService: ReprodutoresService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo reprodutor' })
  @ApiResponse({
    status: 201,
    description: 'Reprodutor cadastrado. scoreFertilidade calculado automaticamente pela IA.',
    schema: {
      example: {
        id: 'uuid',
        nome: 'Trovão do Sertão',
        especie: 'bovino',
        raca: 'Nelore',
        scoreFertilidade: 83,
        scoreEstimado: 85,
        totalInseminacoes: 20,
        prenhezes: 15,
        ativo: true,
        animalId: 'uuid-do-animal-ou-null',
        animal: { id: 'uuid', identificador: 'GARANHAL-001', dataNascimento: '2020-06-10T00:00:00.000Z', fotoUrl: null },
      },
    },
  })
  criar(@Body() dto: CriarReprodutorDto, @UsuarioAtual() usuario: any) {
    return this.reprodutoresService.criar(dto, usuario.id);
  }

  @Get('fazenda/:fazendaId')
  @ApiOperation({ summary: 'Listar reprodutores da fazenda' })
  @ApiQuery({ name: 'especie', required: false, enum: ['bovino', 'ovino', 'caprino'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de reprodutores',
    schema: {
      example: {
        data: [
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
        total: 4,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  listar(
    @Param('fazendaId') fazendaId: string,
    @Query('especie') especie: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @UsuarioAtual() usuario: any,
  ) {
    return this.reprodutoresService.listar(fazendaId, usuario.id, especie, page ? +page : 1, limit ? +limit : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar reprodutor por ID' })
  @ApiResponse({ status: 200, description: 'Dados do reprodutor' })
  @ApiResponse({ status: 404, description: 'Reprodutor não encontrado' })
  buscarPorId(@Param('id') id: string, @UsuarioAtual() usuario: any) {
    return this.reprodutoresService.buscarPorId(id, usuario.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar reprodutor (score recalculado automaticamente se raça mudar)' })
  @ApiResponse({ status: 200, description: 'Reprodutor atualizado' })
  atualizar(@Param('id') id: string, @Body() dto: AtualizarReprodutorDto, @UsuarioAtual() usuario: any) {
    return this.reprodutoresService.atualizar(id, dto, usuario.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativar reprodutor' })
  @ApiResponse({ status: 200, description: 'Reprodutor inativado' })
  remover(@Param('id') id: string, @UsuarioAtual() usuario: any) {
    return this.reprodutoresService.remover(id, usuario.id);
  }
}
