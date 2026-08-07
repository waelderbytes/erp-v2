// Migration 0012 fuer erp-service. Roadmap-Punkt "Stueckliste (BOM)",
// Nutzerentscheidung 08.08.2026: volle mehrstufige Variante (nicht die
// einfachere empfohlene), feste Menge pro Position (kein Verschnitt-Feld),
// nur echte Artikel-Positionen (keine Text-/Titelzeilen). ERP v1 hat die
// "Strukturstueckliste" (druckbare mehrstufige Ansicht) selbst NIE fertig
// gebaut - Datenmodell hier komplett neu entworfen, das flache v1-Modell
// diente nur als grobe Orientierung.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Stueckliste1786137114027 implements MigrationInterface {
  name = 'Stueckliste1786137114027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE stueckliste_position (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kopf_artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE CASCADE,
        position_artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE RESTRICT,
        menge NUMERIC(14,3) NOT NULL CHECK (menge > 0),
        sortierung INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (kopf_artikel_id, position_artikel_id),
        CHECK (kopf_artikel_id <> position_artikel_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX stueckliste_position_kopf_idx ON stueckliste_position (kopf_artikel_id)
    `);
    await queryRunner.query(`
      CREATE TRIGGER stueckliste_position_audit
      AFTER INSERT OR UPDATE OR DELETE ON stueckliste_position
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER stueckliste_position_audit ON stueckliste_position`);
    await queryRunner.query(`DROP TABLE stueckliste_position`);
  }
}
