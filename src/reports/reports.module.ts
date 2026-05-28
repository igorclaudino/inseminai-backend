import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  providers: [ReportsService, FarmGuard],
  controllers: [ReportsController],
})
export class ReportsModule {}
