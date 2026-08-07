// Migration 0004 fuer erp-service. Lagerverwaltung MVP: Lagerorte, Bestand je
// Artikel+Lager, unveraenderliches Bewegungs-Ledger. Siehe
// docs/module-uebersicht.md "Lagerverwaltung" fuer den fachlichen Kontext.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Lagerverwaltung1786095356631 implements MigrationInterface {
  name = 'Lagerverwaltung1786095356631';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE lager (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bezeichnung VARCHAR(200) NOT NULL,
        ist_standard BOOLEAN NOT NULL DEFAULT false,
        aktiv BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    // Hoechstens 1 Standardlager - gleiches Muster wie artikel_lieferant_ein_favorit.
    await queryRunner.query(`
      CREATE UNIQUE INDEX lager_ein_standard
      ON lager (ist_standard) WHERE ist_standard = true
    `);

    await queryRunner.query(`
      CREATE TABLE lagerbestand (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE CASCADE,
        lager_id UUID NOT NULL REFERENCES lager(id) ON DELETE RESTRICT,
        menge NUMERIC(14,3) NOT NULL DEFAULT 0,
        UNIQUE (artikel_id, lager_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE lagerbewegung (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE RESTRICT,
        lager_id UUID NOT NULL REFERENCES lager(id) ON DELETE RESTRICT,
        typ VARCHAR(30) NOT NULL CHECK (typ IN ('wareneingang','warenausgang','umbuchung','inventur_korrektur')),
        menge NUMERIC(14,3) NOT NULL,
        umbuchung_gruppe_id UUID,
        kommentar TEXT,
        gebucht_von UUID NOT NULL,
        gebucht_am TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX lagerbewegung_artikel_lager_idx ON lagerbewegung (artikel_id, lager_id)`);

    // Audit-Trigger nur fuer lager + lagerbestand (veraenderbare Stammdaten).
    // lagerbewegung ist per Konstruktion ein Insert-only-Ledger - kein UPDATE/DELETE
    // vorgesehen, daher kein Trigger noetig (siehe Entity-Kommentar).
    for (const table of ['lager', 'lagerbestand']) {
      await queryRunner.query(`
        CREATE TRIGGER ${table}_audit
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
      `);
    }

    // RBAC-Seed fuer modul_key 'lager', siehe docs/rbac-rollenkatalog.md.
    await queryRunner.query(`
      INSERT INTO berechtigung (modul_key, aktion) VALUES
        ('lager', 'lesen'), ('lager', 'schreiben'), ('lager', 'loeschen'), ('lager', 'administrieren')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'sachbearbeiter' AND b.modul_key = 'lager' AND b.aktion IN ('lesen','schreiben')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'lesend' AND b.modul_key = 'lager' AND b.aktion = 'lesen'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE lagerbewegung`);
    await queryRunner.query(`DROP TABLE lagerbestand`);
    await queryRunner.query(`DROP TABLE lager`);
  }
}
