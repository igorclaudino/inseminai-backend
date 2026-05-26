import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CriarPesagemDto {
  @ApiProperty({ example: 'animal-uuid-aqui', description: 'ID do animal' })
  @IsString()
  animalId: string;

  @ApiProperty({ example: 385.5, description: 'Peso em quilogramas' })
  @IsNumber()
  @Min(0)
  pesoKg: number;

  @ApiProperty({ example: '2024-05-20', description: 'Data da pesagem' })
  @IsDateString()
  dataPesagem: string;

  @ApiProperty({ example: 'Pesagem pré-cobertura', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;
}
