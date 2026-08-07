import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artikel } from './database/entities/artikel.entity';
import { ArtikelUebersetzung } from './database/entities/artikel-uebersetzung.entity';
import { ArtikelLieferant } from './database/entities/artikel-lieferant.entity';
import { Artikelkategorie } from './database/entities/artikelkategorie.entity';
import { ArtikelkategorieZuordnung } from './database/entities/artikelkategorie-zuordnung.entity';
import { Firma } from './database/entities/firma.entity';
import { Nummernkreis } from './database/entities/nummernkreis.entity';
import { Kunde } from './database/entities/kunde.entity';
import { KundeAdresse } from './database/entities/kunde-adresse.entity';
import { KundeKontakt } from './database/entities/kunde-kontakt.entity';
import { KundeBewertung } from './database/entities/kunde-bewertung.entity';
import { Bewertungskriterium } from './database/entities/bewertungskriterium.entity';
import { Lieferant } from './database/entities/lieferant.entity';
import { LieferantAdresse } from './database/entities/lieferant-adresse.entity';
import { LieferantKontakt } from './database/entities/lieferant-kontakt.entity';
import { Lager } from './database/entities/lager.entity';
import { Lagerbestand } from './database/entities/lagerbestand.entity';
import { Lagerbewegung } from './database/entities/lagerbewegung.entity';
import { Bestellung } from './database/entities/bestellung.entity';
import { Bestellposition } from './database/entities/bestellposition.entity';
import { Artikelpreis } from './database/entities/artikelpreis.entity';
import { Einheit } from './database/entities/einheit.entity';
import { StuecklistePosition } from './database/entities/stueckliste-position.entity';
import { ArtikelModule } from './modules/artikel/artikel.module';
import { FirmaModule } from './modules/firma/firma.module';
import { NummernkreisModule } from './modules/nummernkreis/nummernkreis.module';
import { KundeModule } from './modules/kunde/kunde.module';
import { LieferantModule } from './modules/lieferant/lieferant.module';
import { LagerModule } from './modules/lager/lager.module';
import { EinkaufModule } from './modules/einkauf/einkauf.module';
import { PreisfindungModule } from './modules/preisfindung/preisfindung.module';
import { EinheitModule } from './modules/einheit/einheit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Artikel, ArtikelUebersetzung, ArtikelLieferant, Artikelkategorie, ArtikelkategorieZuordnung, Firma, Nummernkreis, Kunde, KundeAdresse, KundeKontakt, KundeBewertung, Bewertungskriterium, Lieferant, LieferantAdresse, LieferantKontakt, Lager, Lagerbestand, Lagerbewegung, Bestellung, Bestellposition, Artikelpreis, Einheit, StuecklistePosition],
        synchronize: false, // Schema ausschliesslich per Migration, siehe CLAUDE.md
      }),
    }),
    ArtikelModule,
    FirmaModule,
    NummernkreisModule,
    KundeModule,
    LieferantModule,
    LagerModule,
    EinkaufModule,
    PreisfindungModule,
    EinheitModule,
  ],
})
export class AppModule {}
