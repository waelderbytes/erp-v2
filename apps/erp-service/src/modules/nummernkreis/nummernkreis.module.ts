import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NummernkreisService } from './nummernkreis.service';
import { NummernkreisController } from './nummernkreis.controller';
import { JwtStrategy } from '../../common/auth';

@Module({
  imports: [PassportModule],
  controllers: [NummernkreisController],
  providers: [NummernkreisService, JwtStrategy],
  exports: [NummernkreisService],
})
export class NummernkreisModule {}
