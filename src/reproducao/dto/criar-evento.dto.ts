import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, IsDateString } from 'class-validator';

export class CriarEventoDto {
  @ApiProperty({ example: 'animal-uuid-aqui', description: 'ID do animal' })
  @IsString()
  animalId: string;

  @ApiProperty({ example: 'reprodutor-uuid-aqui', required: false, description: 'ID do reprodutor (para inseminação/monta)' })
  @IsOptional()
  @IsString()
  reprodutorId?: string;

  @ApiProperty({
    example: 'inseminacao_artificial',
    enum: ['inseminacao_artificial', 'monta_natural', 'monta_controlada', 'cio', 'parto', 'aborto', 'prenhez'],
  })
  @IsIn(['inseminacao_artificial', 'monta_natural', 'monta_controlada', 'cio', 'parto', 'aborto', 'prenhez'])
  tipoEvento: string;

  @ApiProperty({ example: 'Dr. Carlos Veterinário', required: false })
  @IsString()
  @IsOptional()
  inseminador?: string;

  @ApiProperty({ example: 'Sêmen Nelore Premium Lote X-42', required: false })
  @IsString()
  @IsOptional()
  semenUtilizado?: string;

  @ApiProperty({ example: 'L-2024-01', required: false })
  @IsString()
  @IsOptional()
  lote?: string;

  @ApiProperty({
    example: 'IATF',
    required: false,
    description: 'Protocolo reprodutivo utilizado',
  })
  @IsString()
  @IsOptional()
  protocoloReprodutivo?: string;

  @ApiProperty({ example: '2024-05-10', description: 'Data do evento' })
  @IsDateString()
  dataEvento: string;

  @ApiProperty({ example: 'Protocolo seguido corretamente. Animal em boa condição.', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
