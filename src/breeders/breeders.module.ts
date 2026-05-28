import { Module } from '@nestjs/common';
import { BreedersController } from './breeders.controller';
import { BreedersService } from './breeders.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BreedersController],
  providers: [BreedersService, FarmGuard],
  exports: [BreedersService],
})
export class BreedersModule {}
