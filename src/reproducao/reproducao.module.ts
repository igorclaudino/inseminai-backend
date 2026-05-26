import { Module } from '@nestjs/common';
import { ReproducaoService } from './reproducao.service';
import { ReproducaoController } from './reproducao.controller';
import { ReprodutoresModule } from '../reprodutores/reprodutores.module';

@Module({
  imports: [ReprodutoresModule],
  providers: [ReproducaoService],
  controllers: [ReproducaoController],
  exports: [ReproducaoService],
})
export class ReproducaoModule {}
