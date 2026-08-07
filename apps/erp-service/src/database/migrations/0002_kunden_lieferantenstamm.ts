// Migration 0002 fuer erp-service. Kunden-/Lieferantenstamm gemaess
// docs/feldkatalog.md Abschnitt 2/3, plus RBAC-Seed fuer modul_key 'kunden' und
// 'lieferanten' (setzt wie 0001_artikelstamm_grundschema.ts voraus, dass die
// auth-service-Migration mit rolle/berechtigung/rolle_berechtigung bereits gelaufen ist).
import { MigrationInterface, QueryRunner } from 'typeorm';

export class KundenLieferantenstamm1786092651431 implements MigrationInterface {
  name = 'KundenLieferantenstamm1786092651431';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Kunde ----------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE kunde (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kundennummer VARCHAR(30) NOT NULL UNIQUE,
        typ VARCHAR(20) NOT NULL CHECK (typ IN ('firma','privatperson')),
        firmenname VARCHAR(200),
        vorname VARCHAR(100),
        nachname VARCHAR(100),
        ust_idnr VARCHAR(20),
        steuernummer VARCHAR(20),
        waehrung VARCHAR(3) NOT NULL DEFAULT 'EUR',
        zahlungsziel_tage INTEGER,
        sprache VARCHAR(5) NOT NULL DEFAULT 'de',
        aktiv BOOLEAN NOT NULL DEFAULT true,
        custom_fields JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE kunde_adresse (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kunde_id UUID NOT NULL REFERENCES kunde(id) ON DELETE CASCADE,
        typ VARCHAR(20) NOT NULL CHECK (typ IN ('rechnung','lieferung','baustelle','sonstige')),
        ist_standard BOOLEAN NOT NULL DEFAULT false,
        strasse VARCHAR(200) NOT NULL,
        plz VARCHAR(10) NOT NULL,
        ort VARCHAR(100) NOT NULL,
        land VARCHAR(2) NOT NULL DEFAULT 'DE',
        zusatz VARCHAR(200)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE kunde_kontakt (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kunde_id UUID NOT NULL REFERENCES kunde(id) ON DELETE CASCADE,
        vorname VARCHAR(100) NOT NULL,
        nachname VARCHAR(100) NOT NULL,
        funktion VARCHAR(100),
        telefon VARCHAR(30),
        email VARCHAR(255),
        ist_hauptkontakt BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // --- Bewertung, siehe feldkatalog.md Abschnitt 2.5 -------------------------------
    await queryRunner.query(`
      CREATE TABLE bewertungskriterium (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('kunde','lieferant')),
        bezeichnung VARCHAR(100) NOT NULL,
        aktiv BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      INSERT INTO bewertungskriterium (entity_type, bezeichnung, sort_order) VALUES
        ('kunde', 'Zahlungsmoral', 1),
        ('kunde', 'Zuverlaessigkeit', 2),
        ('kunde', 'Kommunikation', 3)
    `);
    await queryRunner.query(`
      CREATE TABLE kunde_bewertung (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kunde_id UUID NOT NULL REFERENCES kunde(id) ON DELETE CASCADE,
        kriterium_id UUID NOT NULL REFERENCES bewertungskriterium(id),
        sterne SMALLINT NOT NULL CHECK (sterne BETWEEN 1 AND 5),
        kommentar TEXT,
        bewertet_von UUID NOT NULL,
        bewertet_am TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (kunde_id, kriterium_id)
      )
    `);

    // --- Lieferant --------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE lieferant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lieferantennummer VARCHAR(30) NOT NULL UNIQUE,
        firmenname VARCHAR(200) NOT NULL,
        ust_idnr VARCHAR(20),
        steuernummer VARCHAR(20),
        waehrung VARCHAR(3) NOT NULL DEFAULT 'EUR',
        zahlungsziel_tage INTEGER,
        iban VARCHAR(34),
        bic VARCHAR(11),
        mindestbestellwert NUMERIC(12,2),
        lieferzeit_tage INTEGER,
        sprache VARCHAR(5) NOT NULL DEFAULT 'de',
        aktiv BOOLEAN NOT NULL DEFAULT true,
        custom_fields JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE lieferant_adresse (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lieferant_id UUID NOT NULL REFERENCES lieferant(id) ON DELETE CASCADE,
        typ VARCHAR(20) NOT NULL CHECK (typ IN ('rechnung','versand_von','werk','sonstige')),
        ist_standard BOOLEAN NOT NULL DEFAULT false,
        strasse VARCHAR(200) NOT NULL,
        plz VARCHAR(10) NOT NULL,
        ort VARCHAR(100) NOT NULL,
        land VARCHAR(2) NOT NULL DEFAULT 'DE',
        zusatz VARCHAR(200)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE lieferant_kontakt (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lieferant_id UUID NOT NULL REFERENCES lieferant(id) ON DELETE CASCADE,
        vorname VARCHAR(100) NOT NULL,
        nachname VARCHAR(100) NOT NULL,
        funktion VARCHAR(100),
        telefon VARCHAR(30),
        email VARCHAR(255),
        ist_hauptkontakt BOOLEAN NOT NULL DEFAULT false
      )
    `);

    // --- artikel_lieferant.lieferant_id jetzt als echter FK, siehe artikel-lieferant.entity.ts ---
    await queryRunner.query(`
      ALTER TABLE artikel_lieferant
      ADD CONSTRAINT fk_artikel_lieferant_lieferant FOREIGN KEY (lieferant_id) REFERENCES lieferant(id) ON DELETE CASCADE
    `);

    // --- Audit-Trigger fuer die neuen Haupttabellen (siehe architecture.md Abschnitt 5) ---
    for (const table of ['kunde', 'lieferant']) {
      await queryRunner.query(`
        CREATE TRIGGER ${table}_audit
        AFTER INSERT OR UPDATE OR DELETE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
      `);
    }

    // --- RBAC-Seed fuer modul_key 'kunden' und 'lieferanten' -------------------------
    await queryRunner.query(`
      INSERT INTO berechtigung (modul_key, aktion) VALUES
        ('kunden', 'lesen'), ('kunden', 'schreiben'), ('kunden', 'loeschen'), ('kunden', 'administrieren'),
        ('lieferanten', 'lesen'), ('lieferanten', 'schreiben'), ('lieferanten', 'loeschen'), ('lieferanten', 'administrieren')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'sachbearbeiter' AND b.modul_key IN ('kunden','lieferanten') AND b.aktion IN ('lesen','schreiben')
    `);
    await queryRunner.query(`
      INSERT INTO rolle_berechtigung (rolle_id, berechtigung_id)
      SELECT r.id, b.id FROM rolle r, berechtigung b
      WHERE r.name = 'lesend' AND b.modul_key IN ('kunden','lieferanten') AND b.aktion = 'lesen'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM rolle_berechtigung WHERE berechtigung_id IN (SELECT id FROM berechtigung WHERE modul_key IN ('kunden','lieferanten'))`);
    await queryRunner.query(`DELETE FROM berechtigung WHERE modul_key IN ('kunden','lieferanten')`);
    for (const table of ['kunde', 'lieferant']) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS ${table}_audit ON ${table}`);
    }
    await queryRunner.query(`ALTER TABLE artikel_lieferant DROP CONSTRAINT IF EXISTS fk_artikel_lieferant_lieferant`);
    await queryRunner.query(`DROP TABLE IF EXISTS lieferant_kontakt`);
    await queryRunner.query(`DROP TABLE IF EXISTS lieferant_adresse`);
    await queryRunner.query(`DROP TABLE IF EXISTS lieferant`);
    await queryRunner.query(`DROP TABLE IF EXISTS kunde_bewertung`);
    await queryRunner.query(`DROP TABLE IF EXISTS bewertungskriterium`);
    await queryRunner.query(`DROP TABLE IF EXISTS kunde_kontakt`);
    await queryRunner.query(`DROP TABLE IF EXISTS kunde_adresse`);
    await queryRunner.query(`DROP TABLE IF EXISTS kunde`);
  }
}
