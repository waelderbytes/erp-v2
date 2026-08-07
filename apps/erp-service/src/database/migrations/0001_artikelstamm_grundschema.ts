// Migration 0001 fuer erp-service (eigene Migrations-Historie, siehe data-source.ts).
// Setzt voraus, dass die auth-service-Migration 0001_initial_schema (rolle/
// berechtigung/rolle_berechtigung) in DERSELBEN physischen Tenant-DB bereits gelaufen
// ist - berechtigung/rolle_berechtigung/rolle sind KEINE eigenen Tabellen von
// erp-service, sondern werden hier nur mit befuellt (gemeinsame Tenant-DB, siehe
// docs/architecture.md Abschnitt 1).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtikelstammGrundschema1786091604490 implements MigrationInterface {
  name = 'ArtikelstammGrundschema1786091604490';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    // --- Nummernkreis-Engine (generisch), siehe architecture.md Abschnitt 6 -------
    await queryRunner.query(`
      CREATE TABLE nummernkreis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_key VARCHAR(30) NOT NULL UNIQUE,
        label VARCHAR(60) NOT NULL,
        prefix VARCHAR(10) NOT NULL DEFAULT '',
        start_value INTEGER NOT NULL DEFAULT 1,
        next_value INTEGER NOT NULL DEFAULT 1,
        stellen INTEGER NOT NULL DEFAULT 5
      )
    `);
    await queryRunner.query(`
      INSERT INTO nummernkreis (entity_key, label) VALUES
        ('artikel', 'Artikel'), ('kunden', 'Kunden'), ('lieferanten', 'Lieferanten')
    `);

    // --- Firma (Singleton), siehe firma.entity.ts ---------------------------------
    await queryRunner.query(`
      CREATE TABLE firma (
        id INTEGER PRIMARY KEY DEFAULT 1,
        artikelnummern_schema VARCHAR(20) NOT NULL DEFAULT 'einfach'
          CHECK (artikelnummern_schema IN ('einfach','kategorie')),
        artikelnummern_stellen INTEGER NOT NULL DEFAULT 5
      )
    `);
    await queryRunner.query(`INSERT INTO firma (id) VALUES (1)`);

    // --- Artikelkategorie + Zuordnung (kategoriebasierte Nummern) ------------------
    await queryRunner.query(`
      CREATE TABLE artikelkategorie (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        typ VARCHAR(10) NOT NULL CHECK (typ IN ('haupt','unter')),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20),
        aktiv BOOLEAN NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(`
      CREATE TABLE artikelkategorie_zuordnung (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ober_id UUID NOT NULL REFERENCES artikelkategorie(id) ON DELETE CASCADE,
        unter_id UUID NOT NULL REFERENCES artikelkategorie(id) ON DELETE CASCADE,
        naechste_nummer INTEGER NOT NULL DEFAULT 1,
        UNIQUE (ober_id, unter_id)
      )
    `);

    // --- Artikel + Artikel-Lieferant ------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE artikel (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artikelnummer VARCHAR(30) NOT NULL UNIQUE,
        artikelart VARCHAR(20) NOT NULL CHECK (artikelart IN ('handelsware','dienstleistung','fertigungsartikel')),
        bezeichnung VARCHAR(200) NOT NULL,
        beschreibung TEXT,
        hauptgruppe_id UUID REFERENCES artikelkategorie(id) ON DELETE SET NULL,
        untergruppe_id UUID REFERENCES artikelkategorie(id) ON DELETE SET NULL,
        einheit VARCHAR(20),
        ean_gtin VARCHAR(20),
        aktiv BOOLEAN NOT NULL DEFAULT true,
        bestandsgefuehrt BOOLEAN NOT NULL DEFAULT false,
        custom_fields JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE artikel_lieferant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        artikel_id UUID NOT NULL REFERENCES artikel(id) ON DELETE CASCADE,
        lieferant_id UUID NOT NULL,
        lieferanten_artikelnummer VARCHAR(60),
        einkaufspreis NUMERIC(12,2),
        lieferzeit_tage INTEGER,
        ist_bevorzugt BOOLEAN NOT NULL DEFAULT false
      )
    `);
    // Hoechstens 1 bevorzugter Lieferant je Artikel - siehe feldkatalog.md Abschnitt 1.4.
    await queryRunner.query(`
      CREATE UNIQUE INDEX artikel_lieferant_ein_favorit
      ON artikel_lieferant (artikel_id) WHERE ist_bevorzugt = true
    `);

    // --- Audit-Trigger auch fuer die neuen Tabellen, siehe architecture.md Abschnitt 5 --
    for (const table of ['artikel', 'artikelkategorie', 'firma']) {
      await queryRunner.query(`
        CREATE TRIGGER ${table}_audit
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
      `);
    }

    // --- RBAC-Seed fuer modul_key 'artikelstamm', siehe docs/rbac-rollenkatalog.md ---
    // Setzt voraus, dass rolle/berechtigung/rolle_berechtigung bereits existieren
    // (auth-service-Migration). Sachbearbeiter: lesen+schreiben. Lesend: nur lesen.
    // Aussendienst bekommt bewusst NICHTS (siehe rbac-rollenkatalog.md Abschnitt 2).
    await queryRunner.query(`
      INSERT INTO berechtigung (modul_key, aktion) VALUES
        ('artikelstamm', 'lesen'),
        ('artikelstamm', 'schreiben'),
        ('artikelstamm', 'loeschen'),
        ('artikelstamm', 'administrieren')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'sachbearbeiter' AND b.modul_key = 'artikelstamm' AND b.aktion IN ('lesen','schreiben')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'lesend' AND b.modul_key = 'artikelstamm' AND b.aktion = 'lesen'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM rolle_berechtigung WHERE berechtigung_id IN (SELECT id FROM berechtigung WHERE modul_key = 'artikelstamm')`);
    await queryRunner.query(`DELETE FROM berechtigung WHERE modul_key = 'artikelstamm'`);
    for (const table of ['artikel', 'artikelkategorie', 'firma']) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS ${table}_audit ON ${table}`);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS artikel_lieferant`);
    await queryRunner.query(`DROP TABLE IF EXISTS artikel`);
    await queryRunner.query(`DROP TABLE IF EXISTS artikelkategorie_zuordnung`);
    await queryRunner.query(`DROP TABLE IF EXISTS artikelkategorie`);
    await queryRunner.query(`DROP TABLE IF EXISTS firma`);
    await queryRunner.query(`DROP TABLE IF EXISTS nummernkreis`);
  }
}
