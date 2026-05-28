import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

const PROTOCOLS = ['FTAI', 'Ovsynch', 'FTAI with eCG', 'Resync', 'Natural Mating', 'Controlled Mating'];

export class PredictPregnancyDto {
  @ApiProperty({ example: 'animal-id-here' })
  @IsString()
  animalId: string;

  @ApiPropertyOptional({ example: 'breeder-id-here' })
  @IsOptional()
  @IsString()
  breederId?: string;

  @ApiPropertyOptional({ example: 'FTAI', enum: PROTOCOLS })
  @IsOptional()
  @IsIn(PROTOCOLS)
  protocol?: string;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  ambientTemperature?: number;

  @ApiPropertyOptional({ example: 'dry', enum: ['dry', 'rainy'] })
  @IsOptional()
  @IsIn(['dry', 'rainy'])
  season?: string;

  @ApiPropertyOptional({ example: 'event-id-here' })
  @IsOptional()
  @IsString()
  reproductiveEventId?: string;
}
