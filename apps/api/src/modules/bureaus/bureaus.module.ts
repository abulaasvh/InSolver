import { Module } from '@nestjs/common';
import { BureausController } from './bureaus.controller';
import { BureausService } from './bureaus.service';

@Module({
  controllers: [BureausController],
  providers: [BureausService],
  exports: [BureausService],
})
export class BureausModule {}
