import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BackofficeService } from './backoffice.service';
import { BackofficeGuard } from './guards/backoffice.guard';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('Backoffice')
@UseGuards(BackofficeGuard)
@ApiHeader({
  name: 'X-Backoffice-Secret',
  description: 'Secret de acesso ao backoffice (env BACKOFFICE_SECRET)',
  required: true,
})
@Controller('backoffice')
export class BackofficeController {
  constructor(private backofficeService: BackofficeService) {}

  @Post('create-admin')
  @ApiOperation({
    summary: 'Criar conta admin com senha temporária',
    description:
      'Cria um usuário com mustChangePassword=true e envia a senha temporária por e-mail. ' +
      'Requer o header X-Backoffice-Secret. O admin não terá fazenda até a primeira troca de senha.',
  })
  @ApiResponse({ status: 201, description: 'Admin criado, e-mail enviado' })
  @ApiResponse({ status: 401, description: 'Secret inválido ou ausente' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.backofficeService.createAdmin(dto);
  }
}
