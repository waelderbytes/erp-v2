// Migration 0017 fuer erp-service. Modul Belegkette (Verkauf): Angebot ->
// Auftragsbestaetigung -> Lieferschein -> Rechnung. Gemeinsames Beleg+
// Beleg-Position-Modell (Feldschema an das eigene ERP v1 angelehnt, Ablauf/
// Teillieferungslogik komplett neu entworfen - siehe Kommentar in
// beleg.entity.ts). Vier neue Nummernkreise (Migration ergaenzt sie NICHT
// per INSERT - nummernkreis.service.ts::ensureNummernkreise() legt fehlende
// Kreise idempotent beim ersten Zugriff an, siehe nummernkreis.entity-
// labels.ts, das hier ebenfalls erweitert wird).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Belegkette1786172406583 implements MigrationInterface {
  name = 'Belegkette1786172406583';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE beleg (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        beleg_typ VARCHAR(30) NOT NULL
          CHECK (beleg_typ IN ('angebot','auftragsbestaetigung','lieferschein','rechnung','proforma','abschlag')),
        belegnummer VARCHAR(30) NOT NULL UNIQUE,
        kunde_id UUID NOT NULL REFERENCES kunde(id),
        status VARCHAR(30) NOT NULL DEFAULT 'offen'
          CHECK (status IN ('offen','teilweise_weitergefuehrt','abgeschlossen','storniert')),
        belegdatum DATE NOT NULL DEFAULT CURRENT_DATE,
        referenz_beleg_id UUID REFERENCES beleg(id),
        festgeschrieben BOOLEAN NOT NULL DEFAULT false,
        kommentar TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TRIGGER beleg_audit
      AFTER INSERT OR UPDATE OR DELETE ON beleg
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);

    await queryRunner.query(`
      CREATE TABLE beleg_position (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        beleg_id UUID NOT NULL REFERENCES beleg(id) ON DELETE CASCADE,
        position_nr INTEGER NOT NULL,
        artikel_id UUID REFERENCES artikel(id) ON DELETE SET NULL,
        bezeichnung VARCHAR(200) NOT NULL,
        menge NUMERIC(14,3) NOT NULL,
        weitergefuehrte_menge NUMERIC(14,3) NOT NULL DEFAULT 0,
        einheit_code VARCHAR(10),
        einzelpreis NUMERIC(12,2) NOT NULL,
        steuersatz_id UUID REFERENCES steuersatz(id) ON DELETE SET NULL,
        steuersatz_prozent NUMERIC(5,2) NOT NULL,
        referenz_position_id UUID REFERENCES beleg_position(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TRIGGER beleg_position_audit
      AFTER INSERT OR UPDATE OR DELETE ON beleg_position
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER beleg_position_audit ON beleg_position`);
    await queryRunner.query(`DROP TABLE beleg_position`);
    await queryRunner.query(`DROP TRIGGER beleg_audit ON beleg`);
    await queryRunner.query(`DROP TABLE beleg`);
  }
}
