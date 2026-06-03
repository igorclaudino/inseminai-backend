import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { VALID_AI_PROFILES } from '../../ai/ai-profile.constants';

export class UpdateFarmDto {
  @ApiPropertyOptional({ example: 'Fazenda São João' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Crateús' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CE' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'standard', enum: VALID_AI_PROFILES, description: 'Perfil de IA padrão da fazenda' })
  @IsOptional()
  @IsIn(VALID_AI_PROFILES)
  aiProfile?: string;
}
