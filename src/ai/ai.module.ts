import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { FarmGuard } from '../common/guards/farm.guard';

@Module({
  providers: [AiService, FarmGuard],
  controllers: [AiController],
})
export class AiModule {}
