import { Module } from '@nestjs/common';
import { NummernkreisService } from './nummernkreis.service';

@Module({
  providers: [NummernkreisService],
  exports: [NummernkreisService],
})
export class NummernkreisModule {}
