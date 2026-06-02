import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PROTOCOLS } from '../../ai/dto/protocols.constants';

export class CreateInseminationDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID da matriz (fêmea) — obtido via GET /animals',
  })
  @IsUUID()
  animalId: string;

  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do reprodutor — obtido via GET /breeders',
  })
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  breederId: string;

  @ApiProperty({ example: 'Dr. Fernando Lima', description: 'Nome do inseminador responsável' })
  @IsString()
  inseminator: string;

  @ApiProperty({ example: 'Nelore MAX-102', description: 'Identificação do sêmen utilizado' })
  @IsString()
  semenUsed: string;

  @ApiProperty({ example: 'Lote 05 - Primíparas', description: 'Lote de animais do protocolo' })
  @IsString()
  lot: string;

  @ApiProperty({ example: 'IATF', enum: PROTOCOLS, description: 'Protocolo reprodutivo utilizado' })
  @IsIn(PROTOCOLS)
  reproductiveProtocol: string;

  @ApiProperty({ example: '2026-05-29', description: 'Data da inseminação (YYYY-MM-DD)' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ example: 'Animal em boa condição corporal' })
  @IsOptional()
  @IsString()
  notes?: string;
}
