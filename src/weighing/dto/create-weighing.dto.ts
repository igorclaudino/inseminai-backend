import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsOptional, IsUUID, IsString } from 'class-validator';

export class CreateWeighingDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID do animal — obtido via GET /animals',
  })
  @IsUUID()
  animalId: string;

  @ApiProperty({ example: 435.5, description: 'Peso em kg' })
  @IsNumber()
  weightKg: number;

  @ApiProperty({ example: '2026-05-29', description: 'Data da pesagem (YYYY-MM-DD)' })
  @IsDateString()
  weighingDate: string;

  @ApiPropertyOptional({ example: 'Pesagem pós-desmame' })
  @IsOptional()
  @IsString()
  notes?: string;
}
