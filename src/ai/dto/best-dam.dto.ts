import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

const PROTOCOLS = ['FTAI', 'Ovsynch', 'FTAI with eCG', 'Resync', 'Natural Mating', 'Controlled Mating'];

export class BestDamDto {
  @ApiPropertyOptional({ example: 'cattle', enum: ['cattle', 'sheep', 'goat'] })
  @IsOptional()
  @IsIn(['cattle', 'sheep', 'goat'])
  species?: string;

  @ApiPropertyOptional({ example: 'FTAI', enum: PROTOCOLS })
  @IsOptional()
  @IsIn(PROTOCOLS)
  protocol?: string;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  ambientTemperature?: number;

  @ApiPropertyOptional({ example: 'dry', enum: ['dry', 'rainy'] })
  @IsOptional()
  @IsIn(['dry', 'rainy'])
  season?: string;

  @ApiPropertyOptional({ example: 5, description: 'Number of animals in ranking (default 5, max 20)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Math.min(20, Math.max(1, parseInt(value) || 5)))
  limit?: number;
}
