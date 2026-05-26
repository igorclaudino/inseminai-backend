import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FazendasModule } from './fazendas/fazendas.module';
import { AnimaisModule } from './animais/animais.module';
import { PesagemModule } from './pesagem/pesagem.module';
import { ReprodutoresModule } from './reprodutores/reprodutores.module';
import { ReproducaoModule } from './reproducao/reproducao.module';
import { IaModule } from './ia/ia.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FazendasModule,
    AnimaisModule,
    PesagemModule,
    ReprodutoresModule,
    ReproducaoModule,
    IaModule,
    RelatoriosModule,
    DashboardModule,
  ],
})
export class AppModule {}
