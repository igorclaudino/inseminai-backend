import { Module } from '@nestjs/common';
import { AnimaisService } from './animais.service';
import { AnimaisController } from './animais.controller';

@Module({
  providers: [AnimaisService],
  controllers: [AnimaisController],
  exports: [AnimaisService],
})
export class AnimaisModule {}
