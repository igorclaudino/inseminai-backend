import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsIn, IsUUID, Min, ValidateIf } from 'class-validator';

export class CriarReprodutorDto {
  @ApiProperty({
    example: null,
    required: false,
    description:
      'ID de um animal macho já cadastrado na fazenda. Quando informado, especie e raca são herdados do animal.',
  })
  @IsUUID()
  @IsOptional()
  animalId?: string;

  @ApiProperty({
    example: 'bovino',
    enum: ['bovino', 'ovino', 'caprino'],
    required: false,
    description: 'Obrigatório quando animalId não informado',
  })
  @ValidateIf((o) => !o.animalId)
  @IsIn(['bovino', 'ovino', 'caprino'])
  especie?: string;

  @ApiProperty({
    example: 'Trovão do Sertão',
    required: false,
    description: 'Obrigatório quando animalId não informado. Sobrescreve o nome do animal quando informado junto com animalId.',
  })
  @ValidateIf((o) => !o.animalId)
  @IsString()
  nome?: string;

  @ApiProperty({
    example: 'Nelore',
    required: false,
    description: 'Obrigatório quando animalId não informado. Herdado do animal quando animalId informado.',
  })
  @ValidateIf((o) => !o.animalId)
  @IsString()
  raca?: string;

  @ApiProperty({ example: 'fazenda-demo-001' })
  @IsString()
  fazendaId: string;

  @ApiProperty({ example: 20, required: false, description: 'Total de inseminações anteriores (para animais já em uso)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalInseminacoes?: number;

  @ApiProperty({ example: 15, required: false, description: 'Prenhezes confirmadas anteriores (para animais já em uso)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  prenhezes?: number;
}
