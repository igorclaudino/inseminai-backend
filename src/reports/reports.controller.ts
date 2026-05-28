import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';

@UseGuards(JwtAuthGuard, FarmGuard)
@ApiBearerAuth('JWT')
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('farm')
  @ApiOperation({ summary: 'General farm performance report' })
  @ApiResponse({ status: 200, description: 'Farm reproductive statistics summary' })
  farmPerformance(@FarmId() farmId: string) {
    return this.reportsService.farmPerformance(farmId);
  }

  @Get('animal/:animalId')
  @ApiOperation({ summary: 'Reproductive performance report for a specific animal' })
  @ApiResponse({ status: 200, description: 'Animal reproductive history and indicators' })
  animalPerformance(@Param('animalId') animalId: string, @FarmId() farmId: string) {
    return this.reportsService.animalPerformance(animalId, farmId);
  }

  @Get('breeders')
  @ApiOperation({ summary: 'Breeder ranking by fertility score' })
  @ApiResponse({ status: 200, description: 'Breeders sorted by fertilityScore (highest = best)' })
  breederRanking(@FarmId() farmId: string) {
    return this.reportsService.breederRanking(farmId);
  }
}
