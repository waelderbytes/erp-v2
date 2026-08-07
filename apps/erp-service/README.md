# erp-service

Warenwirtschaft-Module: Artikelstamm + Kunden-/Lieferantenstamm (siehe
docs/module-uebersicht.md Phase 1). Nutzt dieselbe Tenant-DB wie auth-service,
eigene Migrations-Historie (migrationsTableName "migrations_erp_service").

## Enthaelt
- Nummernkreis-Engine (generisch, Row-Lock) - docs/architecture.md Abschnitt 6
- Kategoriebasierte Artikelnummern (Zaehler je Haupt-/Untergruppen-Kombination)
- Firma-Singleton mit Sperr-Logik fuer artikelnummern_schema
- Artikel-CRUD, Artikel-Lieferant-Favorit
- Kunde/Lieferant-CRUD (anlegen/liste/find) inkl. Adressen/Kontakte (nested beim
  Anlegen), Kundenbewertung (Sterne je Kriterium, siehe feldkatalog.md Abschnitt 2.5)
- RBAC scharf: modul_key "artikelstamm" / "kunden" / "lieferanten"

## Bekannte Einschraenkungen (bewusst, nicht vergessen)
- Keine i18n-Mehrsprachigkeit bei Artikel-`bezeichnung`
- `einheit`/`steuersatz` noch keine FKs auf eigene Stammdaten (existieren noch nicht)
- Kein Update/Löschen fuer Kunde/Lieferant/Artikel - nur Anlegen/Lesen (MVP)
- Lieferantenbewertung (analog Kundenbewertung) nicht umgesetzt, Datenmodell
  (`bewertungskriterium.entity_type`) ist dafuer vorbereitet
- `libs/common`-Code hier unter `src/common/` dupliziert (Docker-Build-Context-Grund)
