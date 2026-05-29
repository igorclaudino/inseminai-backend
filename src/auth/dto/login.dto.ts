import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@fazenda.com.br', description: 'E-mail cadastrado no register' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@2026', description: 'Senha cadastrada no register' })
  @IsString()
  password: string;
}
