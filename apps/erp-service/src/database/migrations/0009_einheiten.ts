// Migration 0009 fuer erp-service. Nutzerentscheidung 08.08.2026: echtes
// Einheiten-Modul (Vorbild ERP v1, waelderbytes-suite modules/stammdaten,
// Tabelle "einheiten") statt einer statischen Liste im Frontend, damit das
// Einheit-Dropdown im Artikel-Wizard erweiterbar bleibt und konsistent ist.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Einheiten1786135016692 implements MigrationInterface {
  name = 'Einheiten1786135016692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE einheit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(50) NOT NULL,
        aktiv BOOLEAN NOT NULL DEFAULT true,
        dezimalstellen INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TRIGGER einheit_audit
      AFTER INSERT OR UPDATE OR DELETE ON einheit
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);

    // Seed gaengiger Standard-Einheiten, damit das Dropdown nicht leer
    // startet - der Nutzer kann jederzeit weitere per "+ anlegen" direkt aus
    // dem Dropdown ergaenzen (siehe v1-Vorbild EinheitDialog).
    await queryRunner.query(`
      INSERT INTO einheit (code, name, dezimalstellen) VALUES
        ('Stk', 'Stück', 0),
        ('h', 'Stunde', 2),
        ('Tag', 'Tag', 2),
        ('kg', 'Kilogramm', 3),
        ('g', 'Gramm', 0),
        ('t', 'Tonne', 3),
        ('m', 'Meter', 2),
        ('m2', 'Quadratmeter', 2),
        ('m3', 'Kubikmeter', 3),
        ('l', 'Liter', 2),
        ('Pausch', 'Pauschale', 0),
        ('Satz', 'Satz', 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER einheit_audit ON einheit`);
    await queryRunner.query(`DROP TABLE einheit`);
  }
}
