import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
})
export class AppModule {}
