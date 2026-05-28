import { PartialType } from '@nestjs/mapped-types';
import { CreateBreederDto } from './create-breeder.dto';

export class UpdateBreederDto extends PartialType(CreateBreederDto) {}
