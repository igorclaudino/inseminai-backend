import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PERFIS_VALIDOS } from '../ia-perfil.constants';

export class AtualizarPerfilIaDto {
  @ApiProperty({
    description: 'Perfil de análise de IA da fazenda',
    enum: PERFIS_VALIDOS,
    example: 'padrao',
  })
  @IsIn(PERFIS_VALIDOS, {
    message: `Perfil inválido. Use um dos valores: ${PERFIS_VALIDOS.join(', ')}`,
  })
  perfilIa: string;
}
