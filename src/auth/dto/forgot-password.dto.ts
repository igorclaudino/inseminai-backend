import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'joao@fazenda.com.br' })
  @IsEmail()
  email: string;
}
