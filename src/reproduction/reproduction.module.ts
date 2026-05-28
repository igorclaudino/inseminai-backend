import { Module } from '@nestjs/common';
import { ReproductionController } from './reproduction.controller';
import { ReproductionService } from './reproduction.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { BreedersModule } from '../breeders/breeders.module';

@Module({
  imports: [PrismaModule, BreedersModule],
  controllers: [ReproductionController],
  providers: [ReproductionService, FarmGuard],
})
export class ReproductionModule {}
