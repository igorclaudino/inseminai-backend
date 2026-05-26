import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get(':fazendaId')
  @ApiOperation({ summary: 'Dados do dashboard — cards, gráfico e distribuição por espécie' })
  @ApiQuery({
    name: 'periodo',
    required: false,
    enum: ['ultima_semana', 'ultimo_mes', 'ultimo_trimestre', 'ultimo_ano', 'todos'],
    example: 'ultimo_mes',
  })
  @ApiQuery({ name: 'tipoAnimal', required: false, enum: ['bovino', 'ovino', 'caprino'] })
  @ApiResponse({
    status: 200,
    description: 'Resumo para o dashboard',
    schema: {
      example: {
        cards: {
          totalAnimais: { valor: 42, variacao: 5 },
          garanhoeAtivos: { valor: 4, variacao: 0 },
          inseminacoesSucesso: { valor: 28, variacao: 12 },
          inseminacoesInsucesso: { valor: 8, variacao: -3 },
          taxaPrenhez: 78,
        },
        grafico: [
          { mes: '2024-01', total: 12, sucesso: 9 },
          { mes: '2024-02', total: 10, sucesso: 7 },
        ],
        distribuicaoPorEspecie: [
          { especie: 'bovino', quantidade: 35 },
          { especie: 'ovino', quantidade: 5 },
          { especie: 'caprino', quantidade: 2 },
        ],
      },
    },
  })
  resumo(
    @Param('fazendaId') fazendaId: string,
    @Query('periodo') periodo: string,
    @Query('tipoAnimal') tipoAnimal: string,
    @UsuarioAtual() usuario: any,
  ) {
    return this.dashboardService.resumo(fazendaId, usuario.id, periodo as any, tipoAnimal);
  }
}
