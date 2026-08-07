import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lager } from '../../database/entities/lager.entity';
import { Lagerbestand } from '../../database/entities/lagerbestand.entity';
import { Lagerbewegung } from '../../database/entities/lagerbewegung.entity';
import { LagerService } from './lager.service';
import { LagerbewegungService } from './lagerbewegung.service';
import { LagerController } from './lager.controller';
import { LagerbewegungController } from './lagerbewegung.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lager, Lagerbestand, Lagerbewegung])],
  controllers: [LagerController, LagerbewegungController],
  providers: [LagerService, LagerbewegungService],
})
export class LagerModule {}
