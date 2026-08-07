// Migration 0001 fuer zeiterfassung-service. Kommt/Geht/Pause-Ledger, siehe
// docs/module-uebersicht.md "Zeiterfassung". FK auf benutzer(id) funktioniert,
// obwohl dieser Service die Tabelle nicht selbst verwaltet - gleiche physische
// Tenant-DB wie auth-service (siehe docs/architecture.md), auth-service-
// Migrationen laufen vor dieser hier (Reihenfolge beim ersten Deployment
// beachten: erst auth-service migrieren, dann zeiterfassung-service).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Zeitbuchung1786111289721 implements MigrationInterface {
  name = 'Zeitbuchung1786111289721';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE zeitbuchung (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        benutzer_id UUID NOT NULL REFERENCES benutzer(id) ON DELETE RESTRICT,
        typ VARCHAR(20) NOT NULL CHECK (typ IN ('kommt','geht','pause_beginn','pause_ende')),
        zeitpunkt TIMESTAMPTZ NOT NULL DEFAULT now(),
        auftrag_id UUID,
        standort_lat NUMERIC(9,6),
        standort_lng NUMERIC(9,6),
        quelle VARCHAR(10) NOT NULL CHECK (quelle IN ('web','kiosk')),
        kommentar TEXT
      )
    `);
    await queryRunner.query(`CREATE INDEX zeitbuchung_benutzer_zeitpunkt_idx ON zeitbuchung (benutzer_id, zeitpunkt)`);

    // Kein Audit-Trigger noetig: zeitbuchung ist wie lagerbewegung ein
    // Insert-only-Ledger (siehe Entity-Kommentar), kein UPDATE/DELETE vorgesehen.

    // RBAC-Berechtigungen fuer modul_key 'zeiterfassung' wurden bereits in
    // auth-service Migration 0002_kiosk_zeiterfassung geseedet (berechtigung/
    // rolle_berechtigung leben in der auth-service-Migrationshistorie, nicht
    // hier) - hier keine erneute RBAC-Migration noetig.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE zeitbuchung`);
  }
}
