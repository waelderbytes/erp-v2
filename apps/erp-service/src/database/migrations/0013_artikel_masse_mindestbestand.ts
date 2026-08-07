// Migration 0013 fuer erp-service. Letzte Luecke aus dem Feldkatalog-Abgleich
// (07./08.08.2026, docs/feldkatalog.md Abschnitt 1.2, Standard-
// Erweiterungsfelder): gewicht_kg, laenge_mm/breite_mm/hoehe_mm,
// mindestbestand fehlten noch. Alle bewusst NULLable/optional (feldkatalog.md
// stuft sie als "optional/nice-to-have" ein, anders als z.B. steuersatz_id).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtikelMasseMindestbestand1786137991787 implements MigrationInterface {
  name = 'ArtikelMasseMindestbestand1786137991787';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE artikel
        ADD COLUMN gewicht_kg NUMERIC(10,3),
        ADD COLUMN laenge_mm NUMERIC(10,2),
        ADD COLUMN breite_mm NUMERIC(10,2),
        ADD COLUMN hoehe_mm NUMERIC(10,2),
        ADD COLUMN mindestbestand NUMERIC(14,3)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE artikel
        DROP COLUMN gewicht_kg,
        DROP COLUMN laenge_mm,
        DROP COLUMN breite_mm,
        DROP COLUMN hoehe_mm,
        DROP COLUMN mindestbestand
    `);
  }
}
