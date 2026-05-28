import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiInsightsService } from './ai-insights.service';
import { FarmGuard } from '../common/guards/farm.guard';
import { ScoringService } from '../domain/scoring/scoring.service';
import { PredictPregnancyUseCase } from '../application/use-cases/predict-pregnancy.use-case';
import { RecommendBreederUseCase } from '../application/use-cases/recommend-breeder.use-case';
import { BestDamUseCase } from '../application/use-cases/best-dam.use-case';

@Module({
  controllers: [AiController],
  providers: [
    // Infrastructure
    AiService,
    AiInsightsService,
    FarmGuard,
    // Domain
    ScoringService,
    // Application — use cases
    PredictPregnancyUseCase,
    RecommendBreederUseCase,
    BestDamUseCase,
    // Global throttler guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AiModule {}
