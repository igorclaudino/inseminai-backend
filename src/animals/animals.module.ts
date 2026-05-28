import { Module } from '@nestjs/common';
import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnimalsController],
  providers: [AnimalsService, FarmGuard],
  exports: [AnimalsService],
})
export class AnimalsModule {}
