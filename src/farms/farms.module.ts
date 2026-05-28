import { Module } from '@nestjs/common';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FarmsController],
  providers: [FarmsService, FarmGuard],
  exports: [FarmsService],
})
export class FarmsModule {}
