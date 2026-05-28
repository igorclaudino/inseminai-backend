import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FarmId } from '../common/decorators/farm-id.decorator';
import { MemberRole } from '../common/decorators/farm-id.decorator';
import { RequireAdmin } from '../common/decorators/require-admin.decorator';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@ApiTags('Farms')
@Controller('farms')
export class FarmsController {
  constructor(private farmsService: FarmsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new farm (creator becomes admin)' })
  create(@Body() dto: CreateFarmDto, @CurrentUser() user: any) {
    return this.farmsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List farms the user is a member of' })
  list(@CurrentUser() user: any) {
    return this.farmsService.list(user.id);
  }

  @Get('current')
  @UseGuards(FarmGuard)
  @ApiOperation({ summary: 'Get current farm (from X-Farm-ID header)' })
  getCurrent(@FarmId() farmId: string, @MemberRole() memberRole: string) {
    return this.farmsService.getCurrent(farmId, memberRole);
  }

  @Put()
  @UseGuards(FarmGuard)
  @RequireAdmin()
  @ApiOperation({ summary: 'Update farm (admin only)' })
  update(@FarmId() farmId: string, @Body() dto: Partial<CreateFarmDto>) {
    return this.farmsService.update(farmId, dto);
  }
}
