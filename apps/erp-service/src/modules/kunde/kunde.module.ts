import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Kunde } from '../../database/entities/kunde.entity';
import { KundeAdresse } from '../../database/entities/kunde-adresse.entity';
import { KundeKontakt } from '../../database/entities/kunde-kontakt.entity';
import { KundeBewertung } from '../../database/entities/kunde-bewertung.entity';
import { Bewertungskriterium } from '../../database/entities/bewertungskriterium.entity';
import { NummernkreisModule } from '../nummernkreis/nummernkreis.module';
import { KundeService } from './kunde.service';
import { KundeController } from './kunde.controller';
import { JwtStrategy } from '../../common/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Kunde, KundeAdresse, KundeKontakt, KundeBewertung, Bewertungskriterium]),
    PassportModule,
    NummernkreisModule,
  ],
  controllers: [KundeController],
  providers: [KundeService, JwtStrategy],
})
export class KundeModule {}
