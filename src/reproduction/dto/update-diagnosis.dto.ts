import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsDateString } from 'class-validator';

export class UpdateDiagnosisDto {
  @ApiProperty({ example: 'positive', enum: ['positive', 'negative', 'conception_failure'] })
  @IsIn(['positive', 'negative', 'conception_failure'])
  pregnancyDiagnosis: string;

  @ApiPropertyOptional({ example: 'Pregnancy confirmed by ultrasound' })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ example: '2024-06-30' })
  @IsOptional()
  @IsDateString()
  confirmationDate?: string;
}
