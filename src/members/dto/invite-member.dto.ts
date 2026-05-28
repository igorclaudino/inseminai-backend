import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'collaborator@farm.com' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'operator', enum: ['admin', 'operator'] })
  @IsString()
  @IsIn(['admin', 'operator'], { message: 'Role must be admin or operator' })
  role: 'admin' | 'operator';
}
