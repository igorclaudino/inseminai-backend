import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PesagemService } from './pesagem.service';
import { CriarPesagemDto } from './dto/criar-pesagem.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Pesagem')
@Controller('pesagem')
export class PesagemController {
  constructor(private pesagemService: PesagemService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nova pesagem' })
  @ApiResponse({
    status: 201,
    description: 'Pesagem registrada',
    schema: {
      example: {
        id: 'uuid',
        animalId: 'animal-uuid',
        pesoKg: 385.5,
        dataPesagem: '2024-05-20T00:00:00.000Z',
        observacoes: 'Pesagem pré-cobertura',
        criadoEm: '2024-05-20T12:00:00.000Z',
      },
    },
  })
  registrar(@Body() dto: CriarPesagemDto, @UsuarioAtual() usuario: any) {
    return this.pesagemService.registrar(dto, usuario.id);
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: 'Histórico de pesagens do animal' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pesagens em ordem cronológica',
    schema: {
      example: [
        { id: 'uuid', pesoKg: 380, dataPesagem: '2024-01-10T00:00:00.000Z' },
        { id: 'uuid', pesoKg: 385.5, dataPesagem: '2024-05-20T00:00:00.000Z' },
      ],
    },
  })
  historico(@Param('animalId') animalId: string, @UsuarioAtual() usuario: any) {
    return this.pesagemService.historico(animalId, usuario.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover pesagem' })
  @ApiResponse({ status: 200, description: 'Pesagem removida' })
  remover(@Param('id') id: string, @UsuarioAtual() usuario: any) {
    return this.pesagemService.remover(id, usuario.id);
  }
}
