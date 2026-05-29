import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsNumber, IsUUID, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBreederDto {
  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Vincula a um animal já cadastrado na fazenda. Preenche name/species/breed automaticamente. Deixe vazio para sêmen externo.',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  animalId?: string;

  @ApiPropertyOptional({ example: 'Imperador do Sertão', description: 'Obrigatório se animalId não for informado' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'cattle', enum: ['cattle', 'sheep', 'goat'], description: 'Obrigatório se animalId não for informado' })
  @IsOptional()
  @IsIn(['cattle', 'sheep', 'goat'])
  species?: string;

  @ApiPropertyOptional({ example: 'Nelore', description: 'Obrigatório se animalId não for informado' })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional({ example: 15, description: 'Total de inseminações realizadas com este reprodutor' })
  @IsOptional()
  @IsNumber()
  totalInseminations?: number;

  @ApiPropertyOptional({ example: 11, description: 'Número de prenhezes confirmadas' })
  @IsOptional()
  @IsNumber()
  pregnancies?: number;
}
