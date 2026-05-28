import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsDateString } from 'class-validator';

const EVENT_TYPES = ['artificial_insemination', 'natural_mating', 'controlled_mating', 'heat', 'birth', 'abortion', 'pregnancy'];

export class CreateEventDto {
  @ApiProperty({ example: 'animal-id-here' })
  @IsString()
  animalId: string;

  @ApiPropertyOptional({ example: 'breeder-id-here' })
  @IsOptional()
  @IsString()
  breederId?: string;

  @ApiProperty({ example: 'artificial_insemination', enum: EVENT_TYPES })
  @IsIn(EVENT_TYPES)
  eventType: string;

  @ApiPropertyOptional({ example: 'Dr. Carlos' })
  @IsOptional()
  @IsString()
  inseminator?: string;

  @ApiPropertyOptional({ example: 'Nelore Lot A' })
  @IsOptional()
  @IsString()
  semenUsed?: string;

  @ApiPropertyOptional({ example: 'Lot-2024-001' })
  @IsOptional()
  @IsString()
  lot?: string;

  @ApiPropertyOptional({ example: 'FTAI' })
  @IsOptional()
  @IsString()
  reproductiveProtocol?: string;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ example: 'Animal in good condition' })
  @IsOptional()
  @IsString()
  notes?: string;
}
