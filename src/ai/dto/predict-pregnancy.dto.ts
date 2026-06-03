import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsNumber, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PROTOCOLS } from './protocols.constants';

export class PredictPregnancyDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID da fêmea — obtido via GET /animals',
  })
  @IsUUID()
  animalId: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do animal macho usado como reprodutor — obtido via GET /animals?sex=male (opcional)',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  sireId?: string;

  /** @deprecated usar sireId — mantido para compatibilidade com frontend */
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  breederId?: string;

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

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do evento reprodutivo — obtido via GET /reproduction (opcional)',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  reproductiveEventId?: string;
}
