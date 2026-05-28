import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReproductionService } from './reproduction.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';

@UseGuards(JwtAuthGuard, FarmGuard)
@ApiBearerAuth('JWT')
@ApiTags('Reproduction')
@Controller('reproduction')
export class ReproductionController {
  constructor(private reproductionService: ReproductionService) {}

  @Post('event')
  @ApiOperation({ summary: 'Register reproductive event' })
  createEvent(@Body() dto: CreateEventDto, @FarmId() farmId: string) {
    return this.reproductionService.createEvent(dto, farmId);
  }

  @Get()
  @ApiOperation({ summary: 'List reproductive events for the farm' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'species', required: false })
  @ApiQuery({ name: 'pregnancyDiagnosis', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @FarmId() farmId: string,
    @Query('search') search: string,
    @Query('species') species: string,
    @Query('pregnancyDiagnosis') pregnancyDiagnosis: string,
    @Query('result') result: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.reproductionService.list(
      farmId,
      { search, species, pregnancyDiagnosis, result, from, to },
      page ? +page : 1, limit ? +limit : 20,
    );
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: 'List reproductive events for an animal' })
  listByAnimal(@Param('animalId') animalId: string, @FarmId() farmId: string) {
    return this.reproductionService.listByAnimal(animalId, farmId);
  }

  @Patch('event/:id/diagnosis')
  @ApiOperation({ summary: 'Update pregnancy diagnosis' })
  updateDiagnosis(
    @Param('id') id: string,
    @Body() dto: UpdateDiagnosisDto,
    @FarmId() farmId: string,
  ) {
    return this.reproductionService.updateDiagnosis(id, dto, farmId);
  }
}
