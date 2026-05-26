import { PartialType } from '@nestjs/swagger';
import { CriarReprodutorDto } from './criar-reprodutor.dto';

export class AtualizarReprodutorDto extends PartialType(CriarReprodutorDto) {}
