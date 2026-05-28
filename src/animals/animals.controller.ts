import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { DeleteAnimalDto } from './dto/delete-animal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';
import { RequireAdmin } from '../common/decorators/require-admin.decorator';

@UseGuards(JwtAuthGuard, FarmGuard)
@ApiBearerAuth('JWT')
@ApiTags('Animals')
@Controller('animals')
export class AnimalsController {
  constructor(private animalsService: AnimalsService) {}

  @Post()
  @ApiOperation({ summary: 'Register new animal' })
  create(@Body() dto: CreateAnimalDto, @FarmId() farmId: string) {
    return this.animalsService.create(dto, farmId);
  }

  @Get()
  @ApiOperation({ summary: 'List farm animals with filters and pagination' })
  @ApiQuery({ name: 'species', required: false, enum: ['cattle', 'sheep', 'goat'] })
  @ApiQuery({ name: 'sex', required: false, enum: ['male', 'female'] })
  @ApiQuery({ name: 'breed', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  list(
    @FarmId() farmId: string,
    @Query('species') species: string,
    @Query('sex') sex: string,
    @Query('breed') breed: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.animalsService.list(
      farmId,
      { species, sex, breed, search },
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get animal by ID' })
  findById(@Param('id') id: string, @FarmId() farmId: string) {
    return this.animalsService.findById(id, farmId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update animal data' })
  update(@Param('id') id: string, @Body() dto: UpdateAnimalDto, @FarmId() farmId: string) {
    return this.animalsService.update(id, dto, farmId);
  }

  @Delete(':id')
  @RequireAdmin()
  @ApiOperation({ summary: 'Delete animal (logical deletion — admin only, reason required)' })
  remove(@Param('id') id: string, @Body() dto: DeleteAnimalDto, @FarmId() farmId: string) {
    return this.animalsService.remove(id, dto, farmId);
  }
}
