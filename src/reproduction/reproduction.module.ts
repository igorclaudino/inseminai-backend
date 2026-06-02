import { Module } from '@nestjs/common';
import { ReproductionController } from './reproduction.controller';
import { ReproductionService } from './reproduction.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [ReproductionController],
  providers: [ReproductionService, FarmGuard],
})
export class ReproductionModule {}
