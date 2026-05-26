import { Module } from '@nestjs/common';
import { PesagemService } from './pesagem.service';
import { PesagemController } from './pesagem.controller';

@Module({
  providers: [PesagemService],
  controllers: [PesagemController],
})
export class PesagemModule {}
