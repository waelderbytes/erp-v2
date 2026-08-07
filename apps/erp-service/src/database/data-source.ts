// Eigene Migrations-Historie fuer erp-service, getrennter migrationsTableName damit
// keine Kollision mit der "migrations"-Tabelle von auth-service in derselben
// physischen Tenant-DB entsteht (1 DB pro Tenant, mehrere Services/Migrationshistorien
// - siehe docs/architecture.md).
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Artikel } from './entities/artikel.entity';
import { ArtikelLieferant } from './entities/artikel-lieferant.entity';
import { Artikelkategorie } from './entities/artikelkategorie.entity';
import { ArtikelkategorieZuordnung } from './entities/artikelkategorie-zuordnung.entity';
import { Firma } from './entities/firma.entity';
import { Nummernkreis } from './entities/nummernkreis.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://erp:changeme@localhost:5432/erp_tenant',
  entities: [Artikel, ArtikelLieferant, Artikelkategorie, ArtikelkategorieZuordnung, Firma, Nummernkreis],
  migrations: [__dirname + '/migrations/*.ts'],
  migrationsTableName: 'migrations_erp_service',
  synchronize: false,
});
