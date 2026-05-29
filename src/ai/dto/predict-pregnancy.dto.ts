import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsNumber, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

const PROTOCOLS = ['FTAI', 'Ovsynch', 'FTAI with eCG', 'Resync', 'Natural Mating', 'Controlled Mating'];

export class PredictPregnancyDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID da fêmea — obtido via GET /animals',
  })
  @IsUUID()
  animalId: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do reprodutor — obtido via GET /breeders (opcional)',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  breederId?: string;

  @ApiPropertyOptional({ example: 'FTAI', enum: PROTOCOLS })
  @IsOptional()
  @IsIn(PROTOCOLS)
  protocol?: string;

  @ApiPropertyOptional({ example: 28, description: 'Temperatura ambiente em °C' })
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
