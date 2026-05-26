import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { FazendasService } from './fazendas.service';
import { CriarFazendaDto } from './dto/criar-fazenda.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Fazendas')
@Controller('fazendas')
export class FazendasController {
  constructor(private fazendasService: FazendasService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova fazenda' })
  @ApiResponse({
    status: 201,
    description: 'Fazenda criada',
    schema: {
      example: {
        id: 'uuid-gerado',
        nome: 'Fazenda São João',
        municipio: 'Crateús',
        estado: 'CE',
        taxaMediaPrenhez: 0,
        criadoEm: '2024-05-20T12:00:00.000Z',
      },
    },
  })
  criar(@Body() dto: CriarFazendaDto, @UsuarioAtual() usuario: any) {
    return this.fazendasService.criar(dto, usuario.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar fazendas do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fazendas',
    schema: {
      example: [
        { id: 'fazenda-demo-001', nome: 'Fazenda São João', municipio: 'Crateús', estado: 'CE' },
      ],
    },
  })
  listar(@UsuarioAtual() usuario: any) {
    return this.fazendasService.listar(usuario.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fazenda por ID' })
  @ApiResponse({ status: 200, description: 'Dados da fazenda' })
  @ApiResponse({ status: 404, description: 'Fazenda não encontrada' })
  buscarPorId(@Param('id') id: string, @UsuarioAtual() usuario: any) {
    return this.fazendasService.buscarPorId(id, usuario.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar dados da fazenda' })
  @ApiResponse({ status: 200, description: 'Fazenda atualizada' })
  atualizar(@Param('id') id: string, @Body() dto: CriarFazendaDto, @UsuarioAtual() usuario: any) {
    return this.fazendasService.atualizar(id, dto, usuario.id);
  }
}
