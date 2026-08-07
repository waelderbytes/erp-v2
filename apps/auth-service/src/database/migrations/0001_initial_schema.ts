// Erste Migration: Grundschema (Benutzer/Rolle/Berechtigung, siehe
// docs/rbac-rollenkatalog.md), Seed der 5 System-Rollen, sowie der generische
// Audit-Log-Mechanismus aus docs/architecture.md Abschnitt 5 (DB-Trigger, nicht
// Application-Code). Migrationen werden ergaenzt, nicht nachtraeglich veraendert
// (siehe CLAUDE.md / Regeln.md Abschnitt 4).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1786091161720 implements MigrationInterface {
  name = 'InitialSchema1786091161720';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`); // fuer gen_random_uuid()

    // --- Rollen/Berechtigungen -------------------------------------------
    await queryRunner.query(`
      CREATE TABLE rolle (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(60) NOT NULL UNIQUE,
        ist_system_rolle BOOLEAN NOT NULL DEFAULT false,
        beschreibung TEXT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE berechtigung (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        modul_key VARCHAR(60) NOT NULL,
        aktion VARCHAR(20) NOT NULL CHECK (aktion IN ('lesen','schreiben','loeschen','administrieren')),
        UNIQUE (modul_key, aktion)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE rolle_berechtigung (
        rolle_id UUID NOT NULL REFERENCES rolle(id) ON DELETE CASCADE,
        berechtigung_id UUID NOT NULL REFERENCES berechtigung(id) ON DELETE CASCADE,
        PRIMARY KEY (rolle_id, berechtigung_id)
      )
    `);

    // --- Benutzer ----------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE benutzer (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        passwort_hash VARCHAR(255) NOT NULL,
        vorname VARCHAR(100),
        nachname VARCHAR(100),
        aktiv BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE benutzer_rolle (
        benutzer_id UUID NOT NULL REFERENCES benutzer(id) ON DELETE CASCADE,
        rolle_id UUID NOT NULL REFERENCES rolle(id) ON DELETE CASCADE,
        PRIMARY KEY (benutzer_id, rolle_id)
      )
    `);

    // --- Seed: 5 System-Rollen, siehe docs/rbac-rollenkatalog.md Abschnitt 2 ---
    // Berechtigungs-Zuordnungen bewusst noch NICHT befuellt (kein Modul mit echten
    // modul_key-Werten existiert bisher) - Owner/Administrator werden im Code
    // (siehe rbac-guard) ohnehin als "hat automatisch alles" behandelt, keine
    // explizite Verknuepfung noetig fuer diese zwei.
    await queryRunner.query(`
      INSERT INTO rolle (name, ist_system_rolle, beschreibung) VALUES
        ('owner', true, 'Alle Rechte, exklusiv Abo-/Modul-Buchung und Tenant-Loeschung'),
        ('administrator', true, 'Alle Rechte in allen gebuchten Modulen, Benutzerverwaltung'),
        ('sachbearbeiter', true, 'Modulweise konfigurierbare Lese-/Schreibrechte'),
        ('lesend', true, 'Nur Leserechte ueber alle gebuchten Module'),
        ('aussendienst', true, 'Eingeschraenkt auf eigene Auftraege/Zeiterfassung')
    `);

    // --- Audit-Log (generisch, DB-Trigger, siehe docs/architecture.md Abschnitt 5) ---
    await queryRunner.query(`
      CREATE TABLE audit_log (
        id BIGSERIAL PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
        old_data JSONB,
        new_data JSONB,
        changed_by UUID,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Nur INSERT erlaubt - Audit-Log ist unveraenderlich (siehe architecture.md Abschnitt 5).
    // Hinweis: REVOKE greift nur, wenn die App-DB-Rolle NICHT Owner der Tabelle ist bzw.
    // kein Superuser - bei echtem Deployment eigene, eingeschraenkte DB-Rolle fuer die
    // Services anlegen (siehe Offene Punkte in architecture.md). In lokaler Dev-Umgebung
    // mit Superuser greift das REVOKE nicht, das ist ein bekannter, dokumentierter Punkt.
    await queryRunner.query(`REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS trigger AS $$
      DECLARE
        v_user UUID;
      BEGIN
        BEGIN
          v_user := current_setting('app.current_user_id', true)::UUID;
        EXCEPTION WHEN OTHERS THEN
          v_user := NULL;
        END;

        IF (TG_OP = 'DELETE') THEN
          INSERT INTO audit_log(table_name, record_id, operation, old_data, changed_by)
          VALUES (TG_TABLE_NAME, OLD.id::TEXT, TG_OP, to_jsonb(OLD), v_user);
          RETURN OLD;
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO audit_log(table_name, record_id, operation, old_data, new_data, changed_by)
          VALUES (TG_TABLE_NAME, NEW.id::TEXT, TG_OP, to_jsonb(OLD), to_jsonb(NEW), v_user);
          RETURN NEW;
        ELSE
          INSERT INTO audit_log(table_name, record_id, operation, new_data, changed_by)
          VALUES (TG_TABLE_NAME, NEW.id::TEXT, TG_OP, to_jsonb(NEW), v_user);
          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger auf die bisher einzigen "echten" Tabellen mit fachlicher Bedeutung.
    // rolle_berechtigung/benutzer_rolle (reine Zuordnungstabellen ohne eigene id-Spalte)
    // bewusst ausgenommen - der Trigger geht von einer id-Spalte aus (siehe TG_TABLE_NAME
    // + OLD/NEW.id oben). Fuer m:n-Tabellen wird Audit spaeter ueber die Haupttabelle
    // bzw. eine eigene Loesung nachgezogen, nicht Teil dieser ersten Migration.
    for (const table of ['benutzer', 'rolle', 'berechtigung']) {
      await queryRunner.query(`
        CREATE TRIGGER ${table}_audit
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['benutzer', 'rolle', 'berechtigung']) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS ${table}_audit ON ${table}`);
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS audit_trigger_fn`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS benutzer_rolle`);
    await queryRunner.query(`DROP TABLE IF EXISTS benutzer`);
    await queryRunner.query(`DROP TABLE IF EXISTS rolle_berechtigung`);
    await queryRunner.query(`DROP TABLE IF EXISTS berechtigung`);
    await queryRunner.query(`DROP TABLE IF EXISTS rolle`);
  }
}
