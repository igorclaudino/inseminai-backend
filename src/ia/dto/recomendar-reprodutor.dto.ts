import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { PERFIS_VALIDOS } from '../ia-perfil.constants';

export class RecomendarReprodutorDto {
  @ApiPropertyOptional({
    example: 'padrao',
    enum: PERFIS_VALIDOS,
    description: 'Sobrescreve o perfil de IA da fazenda apenas para esta análise.',
  })
  @IsOptional()
  @IsIn(PERFIS_VALIDOS)
  perfilIaOverride?: string;
}
