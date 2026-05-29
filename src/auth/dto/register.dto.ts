import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'joao@fazenda.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@2026', description: 'Mínimo 6 caracteres', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
