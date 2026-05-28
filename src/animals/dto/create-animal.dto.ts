import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

const SPECIES = ['cattle', 'sheep', 'goat'];
const SEXES = ['male', 'female'];

export class CreateAnimalDto {
  @ApiProperty({ example: 'BOV-001' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'cattle', enum: SPECIES })
  @IsIn(SPECIES)
  species: string;

  @ApiProperty({ example: 'Mimosa' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Nelore' })
  @IsString()
  breed: string;

  @ApiPropertyOptional({ example: 'Line A' })
  @IsOptional()
  @IsString()
  lineage?: string;

  @ApiProperty({ example: 'female', enum: SEXES })
  @IsIn(SEXES)
  sex: string;

  @ApiPropertyOptional({ example: '2021-03-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 3, description: 'Body condition score 1-5' })
  @IsOptional()
  @IsNumber()
  bodyConditionScore?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  reproductiveDiseaseHistory?: boolean;

  @ApiPropertyOptional({ example: 'sire-id' })
  @IsOptional()
  @IsString()
  sireId?: string;

  @ApiPropertyOptional({ example: 'dam-id' })
  @IsOptional()
  @IsString()
  damId?: string;

  @ApiPropertyOptional({ example: 420.5 })
  @IsOptional()
  @IsNumber()
  initialWeight?: number;

  @ApiPropertyOptional({ example: '2024-01-10' })
  @IsOptional()
  @IsDateString()
  initialWeighingDate?: string;
}
