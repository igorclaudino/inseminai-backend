import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BreedersService } from './breeders.service';
import { CreateBreederDto } from './dto/create-breeder.dto';
import { UpdateBreederDto } from './dto/update-breeder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';
import { RequireAdmin } from '../common/decorators/require-admin.decorator';

@UseGuards(JwtAuthGuard, FarmGuard)
@ApiBearerAuth('JWT')
@ApiTags('Breeders')
@Controller('breeders')
export class BreedersController {
  constructor(private breedersService: BreedersService) {}

  @Post()
  @ApiOperation({ summary: 'Register new breeder' })
  create(@Body() dto: CreateBreederDto, @FarmId() farmId: string) {
    return this.breedersService.create(dto, farmId);
  }

  @Get()
  @ApiOperation({ summary: 'List farm breeders' })
  @ApiQuery({ name: 'species', required: false, enum: ['cattle', 'sheep', 'goat'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @FarmId() farmId: string,
    @Query('species') species: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.breedersService.list(farmId, species, page ? +page : 1, limit ? +limit : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get breeder by ID' })
  findById(@Param('id') id: string, @FarmId() farmId: string) {
    return this.breedersService.findById(id, farmId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update breeder data' })
  update(@Param('id') id: string, @Body() dto: UpdateBreederDto, @FarmId() farmId: string) {
    return this.breedersService.update(id, dto, farmId);
  }

  @Delete(':id')
  @RequireAdmin()
  @ApiOperation({ summary: 'Remove breeder (logical deletion — admin only)' })
  remove(@Param('id') id: string, @FarmId() farmId: string) {
    return this.breedersService.remove(id, farmId);
  }
}
