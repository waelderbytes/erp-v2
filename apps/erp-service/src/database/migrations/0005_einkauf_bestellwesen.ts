// Migration 0005 fuer erp-service. Einkauf/Bestellwesen MVP: Bestellungen an
// Lieferanten mit Positionen, Wareneingang auf Bestellung gebucht. Siehe
// docs/module-uebersicht.md "Einkauf/Bestellwesen".
import { MigrationInterface, QueryRunner } from 'typeorm';

export class EinkaufBestellwesen1786095891155 implements MigrationInterface {
  name = 'EinkaufBestellwesen1786095891155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE bestellung (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bestellnummer VARCHAR(30) NOT NULL UNIQUE,
        lieferant_id UUID NOT NULL REFERENCES lieferant(id) ON DELETE RESTRICT,
        status VARCHAR(30) NOT NULL DEFAULT 'offen'
          CHECK (status IN ('offen','bestellt','teilweise_geliefert','abgeschlossen','storniert')),
        bestelldatum DATE NOT NULL DEFAULT CURRENT_DATE,
        erwartetes_lieferdatum DATE,
        kommentar TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE bestellposition (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bestellung_id UUID NOT NULL REFERENCES bestellung(id) ON DELETE CASCADE,
        artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE RESTRICT,
        menge NUMERIC(14,3) NOT NULL,
        gelieferte_menge NUMERIC(14,3) NOT NULL DEFAULT 0,
        einzelpreis NUMERIC(12,2)
      )
    `);
    await queryRunner.query(`CREATE INDEX bestellposition_bestellung_idx ON bestellposition (bestellung_id)`);

    // Rueckverfolgbarkeit: welche Lagerbewegung gehoert zu welcher Bestellposition.
    // Generisch (referenz_typ/referenz_id) statt einer festen FK auf bestellposition,
    // damit spaeter auch andere Belegarten (z. B. Lieferschein-Ausgang) ohne erneute
    // Schemaaenderung referenzieren koennen - gleiches Muster wie der generische
    // dokument-Anhang in feldkatalog.md.
    await queryRunner.query(`ALTER TABLE lagerbewegung ADD COLUMN referenz_typ VARCHAR(30)`);
    await queryRunner.query(`ALTER TABLE lagerbewegung ADD COLUMN referenz_id UUID`);
    await queryRunner.query(`CREATE INDEX lagerbewegung_referenz_idx ON lagerbewegung (referenz_typ, referenz_id)`);

    for (const table of ['bestellung', 'bestellposition']) {
      await queryRunner.query(`
        CREATE TRIGGER ${table}_audit
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
      `);
    }

    // RBAC-Seed fuer modul_key 'einkauf', siehe docs/rbac-rollenkatalog.md.
    await queryRunner.query(`
      INSERT INTO berechtigung (modul_key, aktion) VALUES
        ('einkauf', 'lesen'), ('einkauf', 'schreiben'), ('einkauf', 'loeschen'), ('einkauf', 'administrieren')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'sachbearbeiter' AND b.modul_key = 'einkauf' AND b.aktion IN ('lesen','schreiben')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'lesend' AND b.modul_key = 'einkauf' AND b.aktion = 'lesen'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE lagerbewegung DROP COLUMN referenz_typ`);
    await queryRunner.query(`ALTER TABLE lagerbewegung DROP COLUMN referenz_id`);
    await queryRunner.query(`DROP TABLE bestellposition`);
    await queryRunner.query(`DROP TABLE bestellung`);
  }
}
