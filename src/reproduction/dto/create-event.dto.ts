import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsDateString, IsUUID, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

const EVENT_TYPES = ['artificial_insemination', 'natural_mating', 'controlled_mating', 'heat', 'birth', 'abortion', 'pregnancy'];

export class CreateEventDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do animal — obtido via GET /animals',
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

  @ApiProperty({ example: 'artificial_insemination', enum: EVENT_TYPES })
  @IsIn(EVENT_TYPES)
  eventType: string;

  @ApiPropertyOptional({ example: 'Dr. Carlos' })
  @IsOptional()
  @IsString()
  inseminator?: string;

  @ApiPropertyOptional({ example: 'Sêmen Nelore Lote A' })
  @IsOptional()
  @IsString()
  semenUsed?: string;

  @ApiPropertyOptional({ example: 'Lote-2026-001' })
  @IsOptional()
  @IsString()
  lot?: string;

  @ApiPropertyOptional({ example: 'FTAI', description: 'Protocolo reprodutivo utilizado' })
  @IsOptional()
  @IsString()
  reproductiveProtocol?: string;

  @ApiProperty({ example: '2026-05-29', description: 'Data do evento (YYYY-MM-DD)' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ example: 'Animal em boa condição corporal' })
  @IsOptional()
  @IsString()
  notes?: string;
}
