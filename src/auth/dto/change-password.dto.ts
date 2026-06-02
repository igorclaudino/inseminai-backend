import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'SenhaTemp2026', description: 'Senha atual (temporária ou anterior)' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NovaSenha@2026', description: 'Nova senha (mínimo 6 caracteres)', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
