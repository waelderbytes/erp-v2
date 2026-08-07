// Migration 0002 fuer auth-service. Ergaenzt Benutzer um Personalnummer/PIN/RFID
// fuer den Kiosk-Login (Mitarbeiter ohne vollen ERP-Zugang stempeln am
// Wandtablet), siehe docs/module-uebersicht.md "Zeiterfassung". PIN/RFID sind
// bewusst NICHT verpflichtend (nullable) - nur Mitarbeiter, die ueber Kiosk
// stempeln sollen, bekommen ueberhaupt eine Personalnummer zugewiesen.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class KioskZeiterfassung1786109907532 implements MigrationInterface {
  name = 'KioskZeiterfassung1786109907532';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE benutzer ADD COLUMN personalnummer VARCHAR(10)`);
    // argon2id-Hash wie passwort_hash - eigenes Feld statt Wiederverwendung von
    // passwort_hash, damit Passwort und PIN unabhaengig voneinander existieren/
    // geaendert werden koennen (ein Benutzer kann beides, nur PIN, oder nur
    // Passwort haben).
    await queryRunner.query(`ALTER TABLE benutzer ADD COLUMN pin_hash VARCHAR(255)`);
    // RFID-Spalte bereits jetzt angelegt, auch wenn die Hardware-Anbindung
    // (Kartenleser am Tablet) noch nicht gebaut ist - vermeidet eine spaetere
    // Schema-Aenderung, sobald echte RFID-Reader-Hardware getestet werden kann.
    await queryRunner.query(`ALTER TABLE benutzer ADD COLUMN rfid_uid VARCHAR(64)`);

    await queryRunner.query(`
      CREATE UNIQUE INDEX benutzer_personalnummer_unique
      ON benutzer (personalnummer) WHERE personalnummer IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX benutzer_rfid_uid_unique
      ON benutzer (rfid_uid) WHERE rfid_uid IS NOT NULL
    `);

    // Kiosk-Geraete (Tablets) authentifizieren sich mit einem eigenen API-Key als
    // Basisschutz (verhindert, dass irgendein Geraet im Netz PIN-Brute-Force
    // gegen den Identifizieren-Endpoint fahren kann) - siehe
    // kiosk-auth.service.ts. Kein Bezug zu einem Benutzer, ein Geraet gehoert
    // der Tenant-Installation, nicht einer Person.
    await queryRunner.query(`
      CREATE TABLE kiosk_geraet (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bezeichnung VARCHAR(200) NOT NULL,
        api_key_hash VARCHAR(255) NOT NULL,
        aktiv BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TRIGGER kiosk_geraet_audit
      AFTER INSERT OR UPDATE OR DELETE ON kiosk_geraet
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    `);

    // RBAC-Seed fuer modul_key 'zeiterfassung', siehe docs/rbac-rollenkatalog.md.
    // 'aussendienst' bekommt bewusst NUR 'schreiben' (eigene Zeitbuchungen
    // erfassen), kein 'lesen' im Sinne von "alle Zeitbuchungen sehen" - passt zur
    // in rbac-rollenkatalog.md vorgemerkten spaeteren Datensatz-Ebene
    // ("nur eigene sehen"), die technisch noch nicht durchgesetzt wird, aber
    // hier zumindest nicht das Gegenteil (alle sehen) versehentlich freigegeben
    // werden soll.
    await queryRunner.query(`
      INSERT INTO berechtigung (modul_key, aktion) VALUES
        ('zeiterfassung', 'lesen'), ('zeiterfassung', 'schreiben'),
        ('zeiterfassung', 'loeschen'), ('zeiterfassung', 'administrieren')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'sachbearbeiter' AND b.modul_key = 'zeiterfassung' AND b.aktion IN ('lesen','schreiben')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'aussendienst' AND b.modul_key = 'zeiterfassung' AND b.aktion = 'schreiben'
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'lesend' AND b.modul_key = 'zeiterfassung' AND b.aktion = 'lesen'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE kiosk_geraet`);
    await queryRunner.query(`ALTER TABLE benutzer DROP COLUMN rfid_uid`);
    await queryRunner.query(`ALTER TABLE benutzer DROP COLUMN pin_hash`);
    await queryRunner.query(`ALTER TABLE benutzer DROP COLUMN personalnummer`);
  }
}
