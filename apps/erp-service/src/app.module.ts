import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artikel } from './database/entities/artikel.entity';
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
import { ArtikelModule } from './modules/artikel/artikel.module';
import { FirmaModule } from './modules/firma/firma.module';
import { NummernkreisModule } from './modules/nummernkreis/nummernkreis.module';
import { KundeModule } from './modules/kunde/kunde.module';
import { LieferantModule } from './modules/lieferant/lieferant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Artikel, ArtikelLieferant, Artikelkategorie, ArtikelkategorieZuordnung, Firma, Nummernkreis, Kunde, KundeAdresse, KundeKontakt, KundeBewertung, Bewertungskriterium, Lieferant, LieferantAdresse, LieferantKontakt],
        synchronize: false, // Schema ausschliesslich per Migration, siehe CLAUDE.md
      }),
    }),
    ArtikelModule,
    FirmaModule,
    NummernkreisModule,
    KundeModule,
    LieferantModule,
  ],
})
export class AppModule {}
