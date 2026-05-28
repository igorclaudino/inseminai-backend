import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WeighingService } from './weighing.service';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';
import { RequireAdmin } from '../common/decorators/require-admin.decorator';

@UseGuards(JwtAuthGuard, FarmGuard)
@ApiBearerAuth('JWT')
@ApiTags('Weighing')
@Controller('weighing')
export class WeighingController {
  constructor(private weighingService: WeighingService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new weighing' })
  create(@Body() dto: CreateWeighingDto, @FarmId() farmId: string) {
    return this.weighingService.create(dto, farmId);
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: 'Get weighing history for an animal' })
  history(@Param('animalId') animalId: string, @FarmId() farmId: string) {
    return this.weighingService.history(animalId, farmId);
  }

  @Delete(':id')
  @RequireAdmin()
  @ApiOperation({ summary: 'Delete a weighing record (admin only)' })
  remove(@Param('id') id: string, @FarmId() farmId: string) {
    return this.weighingService.remove(id, farmId);
  }
}
