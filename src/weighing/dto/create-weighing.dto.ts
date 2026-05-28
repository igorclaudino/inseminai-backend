import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateWeighingDto {
  @ApiProperty({ example: 'animal-id-here' })
  @IsString()
  animalId: string;

  @ApiProperty({ example: 435.5 })
  @IsNumber()
  weightKg: number;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  weighingDate: string;

  @ApiPropertyOptional({ example: 'Post-weaning weighing' })
  @IsOptional()
  @IsString()
  notes?: string;
}
