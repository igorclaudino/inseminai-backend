import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CriarFazendaDto {
  @ApiProperty({ example: 'Fazenda São João' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'Crateús', required: false })
  @IsString()
  @IsOptional()
  municipio?: string;

  @ApiProperty({ example: 'CE', required: false })
  @IsString()
  @IsOptional()
  estado?: string;
}
