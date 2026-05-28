import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FarmsModule } from './farms/farms.module';
import { AnimalsModule } from './animals/animals.module';
import { WeighingModule } from './weighing/weighing.module';
import { BreedersModule } from './breeders/breeders.module';
import { ReproductionModule } from './reproduction/reproduction.module';
import { AiModule } from './ai/ai.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MembersModule } from './members/members.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    FarmsModule,
    AnimalsModule,
    WeighingModule,
    BreedersModule,
    ReproductionModule,
    AiModule,
    ReportsModule,
    DashboardModule,
    MembersModule,
    InvitationsModule,
    HealthModule,
  ],
})
export class AppModule {}
