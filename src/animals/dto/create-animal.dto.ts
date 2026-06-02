import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsNumber, IsDateString, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

const SPECIES = ['cattle', 'sheep', 'goat'];
const SEXES = ['male', 'female'];

export class CreateAnimalDto {
  @ApiProperty({ example: 'BOV-001', description: 'Identificador único do animal na fazenda' })
  @IsString()
  identifier: string;

  @ApiPropertyOptional({ example: '587962', description: 'Código RFID do brinco eletrônico (opcional)' })
  @IsOptional()
  @IsString()
  rfid?: string;

  @ApiProperty({ example: 'cattle', enum: SPECIES })
  @IsIn(SPECIES)
  species: string;

  @ApiProperty({ example: 'Mimosa' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Nelore' })
  @IsString()
  breed: string;

  @ApiPropertyOptional({ example: 'Linhagem A' })
  @IsOptional()
  @IsString()
  lineage?: string;

  @ApiProperty({ example: 'female', enum: SEXES })
  @IsIn(SEXES)
  sex: string;

  @ApiPropertyOptional({ example: '2022-03-15', description: 'Data de nascimento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 3, description: 'Escore de condição corporal de 1 a 5' })
  @IsOptional()
  @IsNumber()
  bodyConditionScore?: number;

  @ApiPropertyOptional({ example: false, description: 'Histórico de doenças reprodutivas' })
  @IsOptional()
  @IsBoolean()
  reproductiveDiseaseHistory?: boolean;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do pai (animal macho já cadastrado) — deixe vazio se não souber',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  sireId?: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID da mãe (animal fêmea já cadastrada) — deixe vazio se não souber',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  damId?: string;

  @ApiPropertyOptional({ example: 320.0, description: 'Peso inicial em kg (cria uma pesagem automaticamente)' })
  @IsOptional()
  @IsNumber()
  initialWeight?: number;

  @ApiPropertyOptional({ example: '2026-05-29', description: 'Data da pesagem inicial (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  initialWeighingDate?: string;
}
