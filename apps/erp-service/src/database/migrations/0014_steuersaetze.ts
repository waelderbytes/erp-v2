// Migration 0014 fuer erp-service. Erster Baustein des Moduls
// Stammdaten/System-Einstellungen (Nutzerentscheidung: erstmal 1 Firma,
// siehe session-handoff.md). Loest artikel.steuersatz_id von einem reinen
// Konzept-Kommentar zu einer echten Tabelle+FK ein (siehe Folgemigration
// 0015_artikel_steuersatz_fk.ts).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Steuersaetze1786139054417 implements MigrationInterface {
  name = 'Steuersaetze1786139054417';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE steuersatz (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bezeichnung VARCHAR(50) NOT NULL,
        satz NUMERIC(5,2) NOT NULL,
        aktiv BOOLEAN NOT NULL DEFAULT true,
        ist_standard BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TRIGGER steuersatz_audit
      AFTER INSERT OR UPDATE OR DELETE ON steuersatz
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);

    // Deutsche Standard-Umsatzsteuersaetze. Regelsteuersatz (19%) ist
    // Standard/Vorauswahl - unabhaengig vom Kleinunternehmer-Flag der Firma
    // (siehe feldkatalog.md Zeile steuersatz_id: "unabhaengig vom
    // Kleinunternehmer-Flag").
    await queryRunner.query(`
      INSERT INTO steuersatz (bezeichnung, satz, ist_standard) VALUES
        ('Regelsteuersatz', 19.00, true),
        ('Ermäßigter Steuersatz', 7.00, false),
        ('Steuerfrei', 0.00, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER steuersatz_audit ON steuersatz`);
    await queryRunner.query(`DROP TABLE steuersatz`);
  }
}
