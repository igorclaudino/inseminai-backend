import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

const PROTOCOLOS = ['IATF', 'Ovsynch', 'IATF com eCG', 'Ressincronização', 'Monta Natural', 'Monta Controlada'];

export class PreverPrenhezDto {
  @ApiProperty({ example: 'animal-uuid-aqui', description: 'ID do animal a ser avaliado' })
  @IsString()
  animalId: string;

  @ApiProperty({ example: 'reprodutor-uuid-aqui', required: false, description: 'ID do reprodutor (opcional, melhora a predição)' })
  @IsString()
  @IsOptional()
  reprodutorId?: string;

  @ApiProperty({
    example: 'IATF',
    enum: PROTOCOLOS,
    required: false,
    description: 'Protocolo reprodutivo planejado',
  })
  @IsIn(PROTOCOLOS)
  @IsOptional()
  protocolo?: string;

  @ApiProperty({ example: 28, required: false, description: 'Temperatura média ambiente em °C' })
  @IsNumber()
  @IsOptional()
  temperaturaAmbiente?: number;

  @ApiProperty({ example: 'seca', enum: ['seca', 'chuvosa'], required: false })
  @IsIn(['seca', 'chuvosa'])
  @IsOptional()
  estacaoAno?: string;
}
