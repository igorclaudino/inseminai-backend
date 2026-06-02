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
  @ApiQuery({ name: 'search', required: false, description: 'Busca por inseminador ou reprodutor' })
  @ApiQuery({ name: 'species', required: false, enum: ['cattle', 'sheep', 'goat'] })
  @ApiQuery({ name: 'eventType', required: false, description: 'Filtra por tipo de evento (ex: artificial_insemination)' })
  @ApiQuery({ name: 'pregnancyDiagnosis', required: false, enum: ['positive', 'negative', 'conception_failure', 'pending'] })
  @ApiQuery({ name: 'result', required: false })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  list(
    @FarmId() farmId: string,
    @Query('search') search: string,
    @Query('species') species: string,
    @Query('eventType') eventType: string,
    @Query('pregnancyDiagnosis') pregnancyDiagnosis: string,
    @Query('result') result: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.reproductionService.list(
      farmId,
      { search, species, eventType, pregnancyDiagnosis, result, from, to },
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
