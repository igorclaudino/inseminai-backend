import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsIn, IsDateString, Min, Max } from 'class-validator';

export class CriarAnimalDto {
  @ApiProperty({ example: 'BOV-2024-001', description: 'Identificador único (brinco, transponder, etc.)' })
  @IsString()
  identificador: string;

  @ApiProperty({ example: 'bovino', enum: ['bovino', 'ovino', 'caprino'] })
  @IsIn(['bovino', 'ovino', 'caprino'])
  especie: string;

  @ApiProperty({ example: 'Mimosa' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'Nelore' })
  @IsString()
  raca: string;

  @ApiProperty({ example: 'Linha A — Alto Ganho', required: false })
  @IsString()
  @IsOptional()
  linhagem?: string;

  @ApiProperty({ example: 'femea', enum: ['macho', 'femea'] })
  @IsIn(['macho', 'femea'])
  sexo: string;

  @ApiProperty({ example: '2022-03-15', required: false, description: 'Data de nascimento (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  dataNascimento?: string;

  @ApiProperty({
    example: 'Apto',
    enum: ['Apto', 'Prenhe', 'Em Reprodução', 'Descarte', 'Inativo'],
    required: false,
  })
  @IsOptional()
  @IsIn(['Apto', 'Prenhe', 'Em Reprodução', 'Descarte', 'Inativo'])
  statusReproducao?: string;

  @ApiProperty({ example: 'José Ferreira', required: false })
  @IsString()
  @IsOptional()
  produtor?: string;

  @ApiProperty({ example: 'https://storage.example.com/foto.jpg', required: false })
  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @ApiProperty({ example: 'fazenda-demo-001' })
  @IsString()
  fazendaId: string;

  @ApiProperty({ example: null, required: false, description: 'ID do pai (animal cadastrado)' })
  @IsString()
  @IsOptional()
  paiId?: string;

  @ApiProperty({ example: null, required: false, description: 'ID da mãe (animal cadastrada)' })
  @IsString()
  @IsOptional()
  maeId?: string;

  // Histórico reprodutivo
  @ApiProperty({ example: 3, required: false, description: 'Número de prenhezes anteriores' })
  @IsNumber()
  @IsOptional()
  historicoPrenhez?: number;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  quantidadeAbortos?: number;

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  quantidadePartos?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  quantidadeCiosDetectados?: number;

  @ApiProperty({ example: 365, required: false, description: 'Intervalo médio entre partos em dias' })
  @IsNumber()
  @IsOptional()
  intervaloMedioPartos?: number;

  // Saúde
  @ApiProperty({ example: 4, minimum: 1, maximum: 5, required: false, description: 'Escore de Condição Corporal (1–5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  scoreCondicaoCorporal?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  historicoDoencaReprodutiva?: boolean;

  // Desempenho ponderal
  @ApiProperty({ example: 32.5, required: false, description: 'Peso ao nascer em kg' })
  @IsNumber()
  @IsOptional()
  pesoNascer?: number;

  @ApiProperty({ example: 0.85, required: false, description: 'Ganho médio de peso pré-desmame (kg/dia)' })
  @IsNumber()
  @IsOptional()
  ganhoPesoPreDesmame?: number;

  @ApiProperty({ example: 210, required: false, description: 'Peso ao desmame em kg' })
  @IsNumber()
  @IsOptional()
  pesoDesmame?: number;

  // Pesagem inicial
  @ApiProperty({ example: 380, required: false, description: 'Peso atual em kg (cria uma pesagem inicial)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  pesoInicial?: number;

  @ApiProperty({ example: '2024-01-10', required: false, description: 'Data da pesagem inicial' })
  @IsDateString()
  @IsOptional()
  dataPesagemInicial?: string;
}
