import { Module } from '@nestjs/common';
import { OverlapsController } from './overlaps.controller';
import { OverlapsService } from './overlaps.service';

@Module({
  controllers: [OverlapsController],
  providers: [OverlapsService],
  exports: [OverlapsService],
})
export class OverlapsModule {}
