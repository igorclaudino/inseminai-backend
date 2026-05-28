import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'operator', enum: ['admin', 'operator'] })
  @IsString()
  @IsIn(['admin', 'operator'], { message: 'Role must be admin or operator' })
  role: 'admin' | 'operator';
}
