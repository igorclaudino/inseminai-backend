import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateFarmDto {
  @ApiProperty({ example: 'Fazenda São João' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Crateús' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CE' })
  @IsOptional()
  @IsString()
  state?: string;
}
