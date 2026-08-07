// Migration 0003 fuer auth-service. RBAC-Seed fuer modul_key 'benutzerverwaltung'
// (siehe modules/benutzer, modules/rollen). Bewusst KEINE rolle_berechtigung-
// Verknuepfung fuer die drei Nicht-Admin-Standardrollen (sachbearbeiter, lesend,
// aussendienst) - Benutzerverwaltung ist laut docs/rbac-rollenkatalog.md
// exklusiv Owner/Administrator vorbehalten, die den RbacGuard ohnehin per
// Rollen-Bypass passieren (siehe common/rbac/rbac.guard.ts). Die
// Berechtigungs-Zeilen existieren trotzdem (Konsistenz mit allen anderen
// Modulen, und damit spaeter bei Bedarf z.B. eine eigene "IT-Support"-Rolle
// gezielt damit verknuepft werden kann, ohne eine weitere Migration zu brauchen).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BenutzerverwaltungRbac1786113163065 implements MigrationInterface {
  name = 'BenutzerverwaltungRbac1786113163065';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO berechtigung (modul_key, aktion) VALUES
        ('benutzerverwaltung', 'lesen'),
        ('benutzerverwaltung', 'schreiben'),
        ('benutzerverwaltung', 'administrieren')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM berechtigung WHERE modul_key = 'benutzerverwaltung'`);
  }
}
