// Migration 0006 fuer erp-service. Preisfindung MVP - siehe
// docs/module-uebersicht.md "Preisfindung".
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Preisfindung1786096385709 implements MigrationInterface {
  name = 'Preisfindung1786096385709';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE artikelpreis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE CASCADE,
        kunde_id UUID REFERENCES kunde(id) ON DELETE CASCADE,
        staffel_ab_menge NUMERIC(14,3) NOT NULL DEFAULT 0,
        preis_netto NUMERIC(12,2) NOT NULL,
        gueltig_von DATE,
        gueltig_bis DATE,
        prioritaet INTEGER NOT NULL DEFAULT 0,
        aktiv BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (gueltig_von IS NULL OR gueltig_bis IS NULL OR gueltig_von <= gueltig_bis)
      )
    `);
    await queryRunner.query(`CREATE INDEX artikelpreis_artikel_idx ON artikelpreis (artikel_id)`);
    await queryRunner.query(`CREATE INDEX artikelpreis_artikel_kunde_idx ON artikelpreis (artikel_id, kunde_id)`);

    await queryRunner.query(`
      CREATE TRIGGER artikelpreis_audit
      AFTER INSERT OR UPDATE OR DELETE ON artikelpreis
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);

    // RBAC-Seed fuer modul_key 'preisfindung', siehe docs/rbac-rollenkatalog.md.
    await queryRunner.query(`
      INSERT INTO berechtigung (modul_key, aktion) VALUES
        ('preisfindung', 'lesen'), ('preisfindung', 'schreiben'), ('preisfindung', 'loeschen'), ('preisfindung', 'administrieren')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'sachbearbeiter' AND b.modul_key = 'preisfindung' AND b.aktion IN ('lesen','schreiben')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'lesend' AND b.modul_key = 'preisfindung' AND b.aktion = 'lesen'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE artikelpreis`);
  }
}
