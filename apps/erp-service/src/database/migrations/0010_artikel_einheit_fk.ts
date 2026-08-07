// Migration 0010 fuer erp-service. Folgemigration zu 0009_einheiten.ts:
// artikel.einheit war bisher ein freies Textfeld - wird jetzt durch eine
// echte FK auf die neue einheit-Tabelle ersetzt (Vorbild ERP v1: dort ist
// unit_id direkt eine FK auf einheiten.id, kein Freitext). Bestehende
// Artikel-Datensaetze mit passendem Freitext (z.B. "Stk", "kg") werden per
// Code-Abgleich auf die neu angelegte Einheit gemappt, alles andere bleibt
// NULL (manuell im Wizard nachzutragen) statt geraten zu werden.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtikelEinheitFk1786135039797 implements MigrationInterface {
  name = 'ArtikelEinheitFk1786135039797';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel ADD COLUMN einheit_id UUID REFERENCES einheit(id)`);
    await queryRunner.query(`
      UPDATE artikel SET einheit_id = einheit.id
      FROM einheit
      WHERE artikel.einheit IS NOT NULL
        AND lower(trim(artikel.einheit)) = lower(einheit.code)
    `);
    await queryRunner.query(`ALTER TABLE artikel DROP COLUMN einheit`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel ADD COLUMN einheit VARCHAR`);
    await queryRunner.query(`
      UPDATE artikel SET einheit = einheit.code
      FROM einheit
      WHERE artikel.einheit_id = einheit.id
    `);
    await queryRunner.query(`ALTER TABLE artikel DROP COLUMN einheit_id`);
  }
}
