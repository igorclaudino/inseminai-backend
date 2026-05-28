import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { VALID_AI_PROFILES } from '../ai-profile.constants';

export class UpdateAiProfileDto {
  @ApiProperty({ example: 'standard', enum: VALID_AI_PROFILES })
  @IsIn(VALID_AI_PROFILES, { message: `Invalid profile. Valid values: ${VALID_AI_PROFILES.join(', ')}` })
  aiProfile: string;
}
