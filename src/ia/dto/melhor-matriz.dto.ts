import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PERFIS_VALIDOS } from '../ia-perfil.constants';

const PROTOCOLOS = ['IATF', 'Ovsynch', 'IATF com eCG', 'Ressincronização', 'Monta Natural', 'Monta Controlada'];

export class MelhorMatrizDto {
  @ApiPropertyOptional({ example: 'bovino', enum: ['bovino', 'ovino', 'caprino'] })
  @IsOptional()
  @IsIn(['bovino', 'ovino', 'caprino'])
  especie?: string;

  @ApiPropertyOptional({ example: 'IATF', enum: PROTOCOLOS })
  @IsOptional()
  @IsIn(PROTOCOLOS)
  protocolo?: string;

  @ApiPropertyOptional({ example: 28, description: 'Temperatura ambiente em °C' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  temperaturaAmbiente?: number;

  @ApiPropertyOptional({ example: 'chuvosa', enum: ['seca', 'chuvosa'] })
  @IsOptional()
  @IsIn(['seca', 'chuvosa'])
  estacaoAno?: string;

  @ApiPropertyOptional({ example: 5, description: 'Número de animais no ranking (padrão: 5, máx: 20)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Math.min(20, Math.max(1, parseInt(value) || 5))  )
  limite?: number;

  @ApiPropertyOptional({
    example: 'padrao',
    enum: PERFIS_VALIDOS,
    description: 'Sobrescreve o perfil de IA da fazenda apenas para esta análise.',
  })
  @IsOptional()
  @IsIn(PERFIS_VALIDOS)
  perfilIaOverride?: string;
}
