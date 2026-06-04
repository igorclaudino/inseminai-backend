import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { PredictPregnancyDto } from './dto/predict-pregnancy.dto';
import { UpdateAiProfileDto } from './dto/update-ai-profile.dto';
import { BestDamDto } from './dto/best-dam.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';
import { RequireAdmin } from '../common/decorators/require-admin.decorator';
import { PredictPregnancyUseCase } from '../application/use-cases/predict-pregnancy.use-case';
import { RecommendBreederUseCase } from '../application/use-cases/recommend-breeder.use-case';
import { BestDamUseCase } from '../application/use-cases/best-dam.use-case';

@UseGuards(JwtAuthGuard, FarmGuard)
@ApiBearerAuth('JWT')
@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private predictPregnancy: PredictPregnancyUseCase,
    private recommendBreeder: RecommendBreederUseCase,
    private bestDam: BestDamUseCase,
  ) {}

  @Post('predict-pregnancy')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({
    summary: 'Predict pregnancy probability with AI analysis',
    description:
      'Calculates pregnancy probability based on 11 zootechnical factors and generates an AI insight ' +
      'according to the profile configured for the farm (Essential / Brief / Standard / Expert).',
  })
  @ApiResponse({ status: 201, description: 'Prediction generated successfully' })
  predictPregnancyHandler(@Body() dto: PredictPregnancyDto, @FarmId() farmId: string) {
    return this.predictPregnancy.execute(dto, farmId);
  }

  @Get('profiles')
  @ApiOperation({
    summary: 'List available AI analysis profiles',
    description:
      'Returns all available profiles (Essential, Brief, Standard, Expert) with their characteristics, ' +
      'estimated latencies, and estimated cost per analysis.',
  })
  @ApiResponse({ status: 200, description: 'List of available profiles' })
  listProfiles() {
    return this.aiService.listProfiles();
  }

  @Get('config')
  @ApiOperation({
    summary: 'Get AI configuration for the farm',
    description:
      'Returns the AI profile currently configured for the farm along with the complete list of available profiles.',
  })
  @ApiResponse({ status: 200, description: 'Current farm AI configuration' })
  getAiConfig(@FarmId() farmId: string) {
    return this.aiService.getAiConfig(farmId);
  }

  @Patch('config')
  @RequireAdmin()
  @ApiOperation({
    summary: 'Update AI profile for the farm',
    description:
      'Sets the AI analysis profile used by default for all predictions in this farm. ' +
      'Accepted values: `essential`, `brief`, `standard`, `expert`. Requires admin role.',
  })
  @ApiBody({ type: UpdateAiProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateAiConfig(@Body() dto: UpdateAiProfileDto, @FarmId() farmId: string) {
    return this.aiService.updateAiConfig(farmId, dto);
  }

  @Get('consumption-report')
  @ApiOperation({
    summary: 'Token consumption report for the farm',
    description:
      'Shows real token consumption grouped by profile, accumulated cost, savings compared to the ' +
      'most complete mode, and cost projections for planning.',
  })
  @ApiResponse({ status: 200, description: 'Full token consumption and cost report' })
  consumptionReport(@FarmId() farmId: string) {
    return this.aiService.consumptionReport(farmId);
  }

  @Get('recommend-breeder/:animalId')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({
    summary: 'Recommend Breeder — ranks breeders by compatibility with the female',
    description:
      'Calculates genetic and fertility compatibility between the female and all active breeders on the farm. ' +
      'Generates AI insight according to the configured profile.',
  })
  @ApiResponse({ status: 200, description: 'Breeder ranking with AI insight' })
  recommendBreederHandler(@Param('animalId') animalId: string, @FarmId() farmId: string) {
    return this.recommendBreeder.execute(farmId, animalId);
  }

  @Get('best-dam')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({
    summary: 'Best Dam — ranks females in the herd ready for insemination',
    description:
      'Evaluates all eligible females on the farm (excluding Pregnant/Inactive/Culled) using the 11-factor ' +
      'scoring model and returns a ranking of those most suited for insemination now.',
  })
  @ApiQuery({ name: 'species', required: false, enum: ['cattle', 'sheep', 'goat'] })
  @ApiQuery({ name: 'protocol', required: false, example: 'FTAI' })
  @ApiQuery({ name: 'ambientTemperature', required: false, example: 28 })
  @ApiQuery({ name: 'season', required: false, enum: ['dry', 'rainy'] })
  @ApiQuery({ name: 'limit', required: false, example: 5, description: 'Number of animals in ranking (max 20)' })
  @ApiResponse({ status: 200, description: 'Best dam ranking with AI insight' })
  bestDamHandler(@Query() dto: BestDamDto, @FarmId() farmId: string) {
    return this.bestDam.execute(farmId, dto);
  }

  @Delete('history/:id')
  @RequireAdmin()
  @ApiOperation({ summary: 'Excluir análise (admin only)' })
  @ApiResponse({ status: 200, description: 'Análise excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Análise não encontrada' })
  deletePrediction(@Param('id') id: string, @FarmId() farmId: string) {
    return this.aiService.deletePrediction(id, farmId);
  }

  @Get('history/farm')
  @ApiOperation({ summary: 'Paginated prediction history for the farm' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated list of predictions with animal data' })
  farmPredictionHistory(
    @FarmId() farmId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.aiService.farmPredictionHistory(farmId, page ? +page : 1, limit ? +limit : 20);
  }

  @Get('history/animal/:animalId')
  @ApiOperation({ summary: 'Prediction history for a specific animal' })
  @ApiResponse({ status: 200, description: 'List of predictions generated for the animal' })
  predictionHistory(@Param('animalId') animalId: string, @FarmId() farmId: string) {
    return this.aiService.predictionHistory(animalId, farmId);
  }
}
