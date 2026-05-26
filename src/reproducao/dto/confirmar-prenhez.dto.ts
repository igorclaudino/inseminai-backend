import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class ConfirmarPrenhezDto {
  @IsBoolean()
  resultadoPrenhez: boolean;

  @IsDateString() @IsOptional()
  dataConfirmacao?: string;
}
