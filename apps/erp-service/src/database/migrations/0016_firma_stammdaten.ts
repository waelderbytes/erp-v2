// Migration 0016 fuer erp-service. Erweitert die Firma-Singleton-Tabelle
// (id=1, siehe firma.entity.ts) um echte Firmenstammdaten. Bewusst NICHT
// firma_id an andere Tabellen angehaengt - Nutzerentscheidung 08.08.2026:
// "erstmal 1 Firma", Mehrfirmen/Niederlassungen bleibt ein separater,
// spaeterer Umbau (siehe module-uebersicht.md).
//
// kleinunternehmer DEFAULT true: Neugruendungen starten nach §19 UStG
// automatisch als Kleinunternehmer (siehe module-uebersicht.md); land
// DEFAULT 'DE' als sinnvoller Default fuer den aktuellen Zielmarkt - beides
// jederzeit im neuen Stammdaten-Screen aenderbar.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FirmaStammdaten1786139054600 implements MigrationInterface {
  name = 'FirmaStammdaten1786139054600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE firma
        ADD COLUMN name VARCHAR(200),
        ADD COLUMN strasse VARCHAR(200),
        ADD COLUMN plz VARCHAR(10),
        ADD COLUMN ort VARCHAR(100),
        ADD COLUMN land VARCHAR(2) NOT NULL DEFAULT 'DE',
        ADD COLUMN ust_id_nr VARCHAR(20),
        ADD COLUMN steuernummer VARCHAR(20),
        ADD COLUMN telefon VARCHAR(50),
        ADD COLUMN email VARCHAR(200),
        ADD COLUMN kleinunternehmer BOOLEAN NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE firma
        DROP COLUMN name,
        DROP COLUMN strasse,
        DROP COLUMN plz,
        DROP COLUMN ort,
        DROP COLUMN land,
        DROP COLUMN ust_id_nr,
        DROP COLUMN steuernummer,
        DROP COLUMN telefon,
        DROP COLUMN email,
        DROP COLUMN kleinunternehmer
    `);
  }
}
