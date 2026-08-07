-- Reset der Bewegungsdaten in der Test-DB (test.wbyt.app), OHNE Stammdaten/
-- Konfiguration anzufassen. Nutzerentscheidung 08.08.2026: "Nur Bewegungsdaten
-- (Recommended)" - siehe docs/session-handoff.md.
--
-- Bleibt UNVERAENDERT (Stammdaten/Konfiguration):
--   firma, nummernkreis (Konfiguration - nur next_value wird zurueckgesetzt),
--   einheit, steuersatz, lager, artikelkategorie, bewertungskriterium
--
-- Wird GELEERT (Bewegungs-/Testdaten):
--   artikel + Nebentabellen, kunde + Nebentabellen, lieferant + Nebentabellen,
--   lagerbestand/lagerbewegung, bestellung/bestellposition
--
-- WICHTIG zu audit_log: Der Audit-Trail ist laut docs/architecture.md
-- Abschnitt 5 bewusst UNVERAENDERLICH (REVOKE UPDATE, DELETE fuer die App-
-- Rolle in Produktion - in lokaler/Test-Umgebung mit Superuser-Verbindung
-- greift das technisch nicht, siehe Kommentar in
-- auth-service Migration 0001_initial_schema.ts). Dieses Skript loescht
-- deshalb NICHT pauschal audit_log, sondern NUR die Eintraege, die sich auf
-- die oben geleerten Tabellen beziehen (scoped DELETE) - Eintraege zu
-- benutzer/rolle/berechtigung bleiben unangetastet. Falls auch das nicht
-- gewuenscht ist: den DELETE-Block am Ende einfach nicht ausfuehren.
--
-- Ausfuehrung auf dem Server, z.B.:
--   docker compose exec -T postgres psql -U erp -d erp_tenant < scripts/reset-testdaten.sql
-- (Datenbank-/Benutzername ggf. an .env anpassen)

BEGIN;

TRUNCATE TABLE
  stueckliste_position,
  artikel_lieferant,
  artikel_uebersetzung,
  artikelkategorie_zuordnung,
  artikelpreis,
  bestellposition,
  bestellung,
  lagerbewegung,
  lagerbestand,
  kunde_bewertung,
  kunde_kontakt,
  kunde_adresse,
  kunde,
  lieferant_kontakt,
  lieferant_adresse,
  lieferant,
  artikel
CASCADE;

-- Nummernkreis-Konfiguration bleibt (Prefix/Stellen), nur der Zaehler wird
-- auf den konfigurierten Startwert zurueckgesetzt, damit neue Testdaten
-- wieder bei Nummer 1 (bzw. dem konfigurierten Startwert) beginnen.
UPDATE nummernkreis SET next_value = start_value;

-- Scoped Audit-Log-Bereinigung, siehe Kommentar oben - nur fuer die
-- geleerten Tabellen, Rest des Audit-Trails (Benutzerverwaltung etc.)
-- bleibt bestehen.
DELETE FROM audit_log WHERE table_name IN (
  'artikel', 'artikel_uebersetzung', 'artikel_lieferant', 'artikelkategorie_zuordnung',
  'artikelpreis', 'stueckliste_position',
  'kunde', 'kunde_adresse', 'kunde_kontakt', 'kunde_bewertung',
  'lieferant', 'lieferant_adresse', 'lieferant_kontakt',
  'lagerbestand', 'lagerbewegung',
  'bestellung', 'bestellposition'
);

COMMIT;
