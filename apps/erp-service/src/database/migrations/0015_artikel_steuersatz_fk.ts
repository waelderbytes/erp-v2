// Migration 0015 fuer erp-service. Folgemigration zu 0014_steuersaetze.ts:
// artikel.steuersatz_id ist bisher nur ein Kommentar im Entity-Code (siehe
// artikel.entity.ts) - wird jetzt zur echten Pflicht-FK (feldkatalog.md:
// steuersatz_id ist "ja" Pflicht). Anders als bei Migration 0010
// (Einheit) gab es hier NIE ein Freitextfeld zu migrieren, sondern echte
// Luecke - bestehende Artikel-Datensaetze bekommen deshalb per Backfill den
// Standard-Steuersatz (Regelsteuersatz 19%) zugewiesen, bevor die Spalte
// auf NOT NULL gesetzt wird. Neue Artikel muessen ab sofort aktiv einen
// Steuersatz mitgeben (siehe artikel-anlegen.dto.ts).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtikelSteuersatzFk1786139054500 implements MigrationInterface {
  name = 'ArtikelSteuersatzFk1786139054500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel ADD COLUMN steuersatz_id UUID REFERENCES steuersatz(id)`);
    await queryRunner.query(`
      UPDATE artikel SET steuersatz_id = (SELECT id FROM steuersatz WHERE ist_standard = true LIMIT 1)
      WHERE steuersatz_id IS NULL
    `);
    await queryRunner.query(`ALTER TABLE artikel ALTER COLUMN steuersatz_id SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel DROP COLUMN steuersatz_id`);
  }
}
