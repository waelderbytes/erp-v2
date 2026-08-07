// Eigene Migrations-Historie fuer erp-service, getrennter migrationsTableName damit
// keine Kollision mit der "migrations"-Tabelle von auth-service in derselben
// physischen Tenant-DB entsteht (1 DB pro Tenant, mehrere Services/Migrationshistorien
// - siehe docs/architecture.md).
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Artikel } from './entities/artikel.entity';
import { ArtikelUebersetzung } from './entities/artikel-uebersetzung.entity';
import { ArtikelLieferant } from './entities/artikel-lieferant.entity';
import { Artikelkategorie } from './entities/artikelkategorie.entity';
import { ArtikelkategorieZuordnung } from './entities/artikelkategorie-zuordnung.entity';
import { Firma } from './entities/firma.entity';
import { Nummernkreis } from './entities/nummernkreis.entity';
import { Kunde } from './entities/kunde.entity';
import { KundeAdresse } from './entities/kunde-adresse.entity';
import { KundeKontakt } from './entities/kunde-kontakt.entity';
import { KundeBewertung } from './entities/kunde-bewertung.entity';
import { Bewertungskriterium } from './entities/bewertungskriterium.entity';
import { Lieferant } from './entities/lieferant.entity';
import { LieferantAdresse } from './entities/lieferant-adresse.entity';
import { LieferantKontakt } from './entities/lieferant-kontakt.entity';
import { Lager } from './entities/lager.entity';
import { Lagerbestand } from './entities/lagerbestand.entity';
import { Lagerbewegung } from './entities/lagerbewegung.entity';
import { Bestellung } from './entities/bestellung.entity';
import { Bestellposition } from './entities/bestellposition.entity';
import { Artikelpreis } from './entities/artikelpreis.entity';
import { Einheit } from './entities/einheit.entity';
import { StuecklistePosition } from './entities/stueckliste-position.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://erp:changeme@localhost:5432/erp_tenant',
  entities: [
    Artikel, ArtikelUebersetzung, ArtikelLieferant, Artikelkategorie, ArtikelkategorieZuordnung, Firma, Nummernkreis,
    Kunde, KundeAdresse, KundeKontakt, KundeBewertung, Bewertungskriterium,
    Lieferant, LieferantAdresse, LieferantKontakt,
    Lager, Lagerbestand, Lagerbewegung,
    Bestellung, Bestellposition,
    Artikelpreis,
    Einheit,
    StuecklistePosition,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'], // .ts fuer lokalen ts-node-Lauf, .js fuer den kompilierten dist/-Lauf im Container (siehe migration:run:prod)
  migrationsTableName: 'migrations_erp_service',
  synchronize: false,
});
