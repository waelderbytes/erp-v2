import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bestellung } from '../../database/entities/bestellung.entity';
import { Bestellposition } from '../../database/entities/bestellposition.entity';
import { NummernkreisModule } from '../nummernkreis/nummernkreis.module';
import { LagerModule } from '../lager/lager.module';
import { EinkaufService } from './einkauf.service';
import { EinkaufController } from './einkauf.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bestellung, Bestellposition]), NummernkreisModule, LagerModule],
  controllers: [EinkaufController],
  providers: [EinkaufService],
})
export class EinkaufModule {}
