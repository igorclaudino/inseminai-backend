import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Maria Souza', description: 'Nome completo do administrador' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'maria@fazenda.com.br', description: 'E-mail para envio da senha temporária' })
  @IsEmail()
  email: string;
}
