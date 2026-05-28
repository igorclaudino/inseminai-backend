import { Module } from '@nestjs/common';
import { WeighingController } from './weighing.controller';
import { WeighingService } from './weighing.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WeighingController],
  providers: [WeighingService, FarmGuard],
})
export class WeighingModule {}
