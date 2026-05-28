import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  providers: [DashboardService, FarmGuard],
  controllers: [DashboardController],
})
export class DashboardModule {}
