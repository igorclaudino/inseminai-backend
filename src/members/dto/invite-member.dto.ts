import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'colaborador@fazenda.com.br' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'operator', enum: ['admin', 'operator'] })
  @IsString()
  @IsIn(['admin', 'operator'], { message: 'Role must be admin or operator' })
  role: 'admin' | 'operator';

  @ApiPropertyOptional({
    example: 'Carlos Pereira',
    description: 'Nome do convidado — usado para criar a conta caso ele ainda não tenha uma',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
