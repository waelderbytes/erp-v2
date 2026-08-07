// Migration 0008 fuer erp-service. Nutzeranfrage (07.08.2026): Mehrsprachigkeit
// fuer Kurztext(bezeichnung)/Langtext(beschreibung) plus ein rein internes
// Notizfeld. Datenmodell bewusst 1:1 aus ERP v1 (waelderbytes-suite,
// Migration 0018_mehrsprachigkeit_interne_notiz.py) uebernommen, dort hat sich
// das Muster bewaehrt: 'de' bleibt DIREKT auf artikel.bezeichnung/beschreibung
// (kein Sonderfall fuer die Standardsprache noetig), zusaetzliche Sprachen
// kommen in eine eigene Tabelle artikel_uebersetzung (1 Zeile je Artikel+
// Sprache). kunde.sprache (existiert bereits seit Migration 0002, Default
// 'de') bestimmt spaeter in der Belegkette (Phase 3, noch nicht gebaut),
// welche Uebersetzung fuer einen Kunden gezogen wird.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MehrsprachigkeitInterneNotiz1786124985301 implements MigrationInterface {
  name = 'MehrsprachigkeitInterneNotiz1786124985301';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE artikel ADD COLUMN interne_notiz TEXT`);

    await queryRunner.query(`
      CREATE TABLE artikel_uebersetzung (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE CASCADE,
        sprache VARCHAR(5) NOT NULL,
        kurztext VARCHAR(100),
        langtext TEXT,
        UNIQUE (artikel_id, sprache)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX artikel_uebersetzung_artikel_id_idx ON artikel_uebersetzung (artikel_id)
    `);
    await queryRunner.query(`
      CREATE TRIGGER artikel_uebersetzung_audit
      AFTER INSERT OR UPDATE OR DELETE ON artikel_uebersetzung
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER artikel_uebersetzung_audit ON artikel_uebersetzung`);
    await queryRunner.query(`DROP TABLE artikel_uebersetzung`);
    await queryRunner.query(`ALTER TABLE artikel DROP COLUMN interne_notiz`);
  }
}
