import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DeleteAnimalDto {
  @ApiProperty({ example: 'Culled due to low reproductive performance' })
  @IsString()
  @MinLength(5, { message: 'Deletion reason must be at least 5 characters' })
  deletionReason: string;
}
