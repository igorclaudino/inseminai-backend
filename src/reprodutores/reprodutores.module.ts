import { Module } from '@nestjs/common';
import { ReprodutoresService } from './reprodutores.service';
import { ReprodutoresController } from './reprodutores.controller';

@Module({
  providers: [ReprodutoresService],
  controllers: [ReprodutoresController],
  exports: [ReprodutoresService],
})
export class ReprodutoresModule {}
