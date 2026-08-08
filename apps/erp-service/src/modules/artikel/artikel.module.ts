import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Artikel } from '../../database/entities/artikel.entity';
import { ArtikelUebersetzung } from '../../database/entities/artikel-uebersetzung.entity';
import { ArtikelLieferant } from '../../database/entities/artikel-lieferant.entity';
import { Artikelkategorie } from '../../database/entities/artikelkategorie.entity';
import { ArtikelkategorieZuordnung } from '../../database/entities/artikelkategorie-zuordnung.entity';
import { Lagerbewegung } from '../../database/entities/lagerbewegung.entity';
import { StuecklistePosition } from '../../database/entities/stueckliste-position.entity';
import { FirmaModule } from '../firma/firma.module';
import { NummernkreisModule } from '../nummernkreis/nummernkreis.module';
import { ArtikelNummerService } from './artikel-nummer.service';
import { ArtikelLogService } from './artikel-log.service';
import { StuecklisteService } from './stueckliste.service';
import { ArtikelService } from './artikel.service';
import { ArtikelController } from './artikel.controller';
import { ArtikelkategorieService } from './artikelkategorie.service';
import { ArtikelkategorieController } from './artikelkategorie.controller';
import { JwtStrategy } from '../../common/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Artikel, ArtikelUebersetzung, ArtikelLieferant, Artikelkategorie, ArtikelkategorieZuordnung, Lagerbewegung, StuecklistePosition]),
    PassportModule,
    FirmaModule,
    NummernkreisModule,
  ],
  controllers: [ArtikelController, ArtikelkategorieController],
  providers: [ArtikelService, ArtikelNummerService, ArtikelLogService, StuecklisteService, ArtikelkategorieService, JwtStrategy],
})
export class ArtikelModule {}
