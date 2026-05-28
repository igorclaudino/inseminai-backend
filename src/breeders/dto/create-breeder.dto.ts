import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsNumber } from 'class-validator';

export class CreateBreederDto {
  @ApiPropertyOptional({ example: 'animal-id-here', description: 'Link to a farm animal (optional, for external semen leave empty)' })
  @IsOptional()
  @IsString()
  animalId?: string;

  @ApiPropertyOptional({ example: 'Imperador' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'cattle', enum: ['cattle', 'sheep', 'goat'] })
  @IsOptional()
  @IsIn(['cattle', 'sheep', 'goat'])
  species?: string;

  @ApiPropertyOptional({ example: 'Nelore' })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  totalInseminations?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @IsNumber()
  pregnancies?: number;
}
