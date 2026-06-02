import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido no e-mail de redefinição' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NovaSenha@2026', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
