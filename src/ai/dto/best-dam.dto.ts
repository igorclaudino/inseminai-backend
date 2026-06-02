import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { PROTOCOLS } from './protocols.constants';

export class BestDamDto {
  @ApiPropertyOptional({ example: 'cattle', enum: ['cattle', 'sheep', 'goat'] })
  @IsOptional()
  @IsIn(['cattle', 'sheep', 'goat'])
  species?: string;

  @ApiPropertyOptional({ example: 'IATF', enum: PROTOCOLS })
  @IsOptional()
  @IsIn(PROTOCOLS)
  protocol?: string;

  @ApiPropertyOptional({ example: 26, description: 'Temperatura ambiente em °C' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  ambientTemperature?: number;

  @ApiPropertyOptional({ example: 'dry', enum: ['dry', 'rainy'] })
  @IsOptional()
  @IsIn(['dry', 'rainy'])
  season?: string;

  @ApiPropertyOptional({ example: 5, description: 'Número de animais no ranking (default 5, máx 20)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Math.min(20, Math.max(1, parseInt(value) || 5)))
  limit?: number;
}
