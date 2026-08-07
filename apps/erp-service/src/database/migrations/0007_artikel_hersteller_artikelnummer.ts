// Migration 0007 fuer erp-service. Nutzeranfrage (08.08.2026): Herstellerartikel-
// nummer (MPN) fehlte bisher komplett, war in feldkatalog.md Abschnitt 1.2 zwar
// vorgesehen, aber nie umgesetzt. Global eindeutig (Nutzerentscheidung), um
// doppelt angelegte Artikel fuer dasselbe Produkt zu verhindern - NULL bleibt
// erlaubt (nicht jeder Artikel hat eine MPN), deshalb partieller statt normaler
// Unique-Index.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtikelHerstellerArtikelnummer1786096636243 implements MigrationInterface {
  name = 'ArtikelHerstellerArtikelnummer1786096636243';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel ADD COLUMN hersteller VARCHAR(200)`);
    await queryRunner.query(`ALTER TABLE artikel ADD COLUMN hersteller_artikelnummer VARCHAR(100)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX artikel_hersteller_artikelnummer_unique
      ON artikel (hersteller_artikelnummer) WHERE hersteller_artikelnummer IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX artikel_hersteller_artikelnummer_unique`);
    await queryRunner.query(`ALTER TABLE artikel DROP COLUMN hersteller_artikelnummer`);
    await queryRunner.query(`ALTER TABLE artikel DROP COLUMN hersteller`);
  }
}
