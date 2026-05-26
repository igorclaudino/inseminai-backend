import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsDateString, IsString } from 'class-validator';

export class AtualizarDiagnosticoDto {
  @ApiProperty({
    example: 'positivo',
    enum: ['pendente', 'positivo', 'negativo', 'falha_concepcao'],
    description: 'Resultado do diagnóstico de prenhez',
  })
  @IsIn(['pendente', 'positivo', 'negativo', 'falha_concepcao'])
  diagnosticoPrenhez: string;

  @ApiProperty({ example: 'Confirmado por ultrassonografia aos 30 dias', required: false })
  @IsString()
  @IsOptional()
  resultado?: string;

  @ApiProperty({ example: '2024-06-10', required: false, description: 'Data do exame de confirmação' })
  @IsDateString()
  @IsOptional()
  dataConfirmacao?: string;
}
