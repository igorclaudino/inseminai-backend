import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FarmGuard } from '../common/guards/farm.guard';
import { FarmId } from '../common/decorators/farm-id.decorator';

@UseGuards(JwtAuthGuard, FarmGuard)
@ApiBearerAuth('JWT')
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard data — cards, chart, and species distribution' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['last_week', 'last_month', 'last_quarter', 'last_year', 'all'],
    example: 'last_month',
  })
  @ApiQuery({ name: 'species', required: false, enum: ['cattle', 'sheep', 'goat'] })
  @ApiResponse({ status: 200, description: 'Dashboard summary' })
  summary(
    @FarmId() farmId: string,
    @Query('period') period: string,
    @Query('species') species: string,
  ) {
    return this.dashboardService.summary(farmId, period as any, species);
  }
}
