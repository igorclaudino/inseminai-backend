import { Module } from '@nestjs/common';
import { FazendasService } from './fazendas.service';
import { FazendasController } from './fazendas.controller';

@Module({
  providers: [FazendasService],
  controllers: [FazendasController],
})
export class FazendasModule {}
