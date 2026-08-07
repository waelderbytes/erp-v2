// Migration 0011 fuer erp-service. Feldkatalog-Abgleich (07./08.08.2026,
// docs/feldkatalog.md Abschnitt 1.2) ergab: "bomfaehig" war in Doku/Roadmap
// als "bereits vorgesehen" beschrieben, existierte aber gar nicht in der
// Entity. Wird jetzt vorab nachgezogen, weil der naechste Roadmap-Punkt
// (Stueckliste/BOM) direkt darauf aufbaut.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtikelBomfaehig1786136472726 implements MigrationInterface {
  name = 'ArtikelBomfaehig1786136472726';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel ADD COLUMN bomfaehig BOOLEAN NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel DROP COLUMN bomfaehig`);
  }
}
