import { PartialType } from '@nestjs/swagger';
import { CriarAnimalDto } from './criar-animal.dto';

export class AtualizarAnimalDto extends PartialType(CriarAnimalDto) {}
