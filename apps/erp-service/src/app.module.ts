import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artikel } from './database/entities/artikel.entity';
import { ArtikelLieferant } from './database/entities/artikel-lieferant.entity';
import { Artikelkategorie } from './database/entities/artikelkategorie.entity';
import { ArtikelkategorieZuordnung } from './database/entities/artikelkategorie-zuordnung.entity';
import { Firma } from './database/entities/firma.entity';
import { Nummernkreis } from './database/entities/nummernkreis.entity';
import { ArtikelModule } from './modules/artikel/artikel.module';
import { FirmaModule } from './modules/firma/firma.module';
import { NummernkreisModule } from './modules/nummernkreis/nummernkreis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Artikel, ArtikelLieferant, Artikelkategorie, ArtikelkategorieZuordnung, Firma, Nummernkreis],
        synchronize: false, // Schema ausschliesslich per Migration, siehe CLAUDE.md
      }),
    }),
    ArtikelModule,
    FirmaModule,
    NummernkreisModule,
  ],
})
export class AppModule {}
