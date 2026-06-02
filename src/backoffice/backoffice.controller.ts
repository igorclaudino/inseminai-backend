import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BackofficeService } from './backoffice.service';
import { BackofficeGuard } from './guards/backoffice.guard';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('Backoffice')
@UseGuards(BackofficeGuard)
@ApiSecurity('X-Backoffice-Secret')
@Controller('backoffice')
export class BackofficeController {
  constructor(private backofficeService: BackofficeService) {}

  @Post('create-admin')
  @ApiOperation({
    summary: 'Create admin account with temporary password',
    description:
      'Creates a user with mustChangePassword=true and sends a temporary password by e-mail. ' +
      'Requires the X-Backoffice-Secret header. The admin will not have a farm until the first password change.',
  })
  @ApiResponse({ status: 201, description: 'Admin created, e-mail sent' })
  @ApiResponse({ status: 401, description: 'Invalid or missing backoffice secret' })
  @ApiResponse({ status: 409, description: 'E-mail already registered' })
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.backofficeService.createAdmin(dto);
  }
}
