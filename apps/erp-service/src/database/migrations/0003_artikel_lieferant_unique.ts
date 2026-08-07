// Migration 0003 fuer erp-service. Schliesst eine echte Datenintegritaets-Luecke:
// artikel_lieferant hatte bisher KEINE Unique-Constraint auf (artikel_id,
// lieferant_id) - nur den partiellen Unique-Index fuer den Favoriten
// (hoechstens 1 Favorit je Artikel). Dadurch konnten beliebig viele Duplikat-
// Zuordnungen fuer dasselbe Artikel-Lieferant-Paar entstehen (beobachtet beim
// End-to-End-Test am 08.08.2026: zwei Zeilen fuer dieselbe Kombination).
//
// Vor dem Anlegen der Constraint werden vorhandene Duplikate bereinigt (behaelt
// jeweils die AELTESTE Zeile, damit eine ggf. bereits gesetzte
// ist_bevorzugt-Markierung nicht verloren geht - falls mehrere Duplikate
// favorisiert waeren, gewinnt trotzdem nur eine wegen des bestehenden partiellen
// Unique-Index).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtikelLieferantUnique1786094462170 implements MigrationInterface {
  name = 'ArtikelLieferantUnique1786094462170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM artikel_lieferant a
      USING artikel_lieferant b
      WHERE a.artikel_id = b.artikel_id
        AND a.lieferant_id = b.lieferant_id
        AND a.ctid > b.ctid
    `);
    await queryRunner.query(`
      ALTER TABLE artikel_lieferant
      ADD CONSTRAINT artikel_lieferant_artikel_lieferant_unique UNIQUE (artikel_id, lieferant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE artikel_lieferant
      DROP CONSTRAINT artikel_lieferant_artikel_lieferant_unique
    `);
  }
}
