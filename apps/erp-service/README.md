# erp-service

Erstes Fachmodul: Artikelstamm (siehe docs/module-uebersicht.md Phase 1). Nutzt
dieselbe Tenant-DB wie auth-service, eigene Migrations-Historie
(migrationsTableName "migrations_erp_service", siehe database/data-source.ts).

## Enthaelt
- Nummernkreis-Engine (generisch, Row-Lock) - docs/architecture.md Abschnitt 6
- Kategoriebasierte Artikelnummern (Zaehler je Haupt-/Untergruppen-Kombination)
- Firma-Singleton mit Sperr-Logik fuer artikelnummern_schema
- Artikel-CRUD (anlegen/liste/find), Artikel-Lieferant-Favorit
- RBAC scharf geschaltet: modul_key "artikelstamm", JwtAuthGuard + RbacGuard

## Bekannte Einschraenkungen (bewusst, nicht vergessen)
- Keine i18n-Mehrsprachigkeit bei `bezeichnung` (einfaches String-Feld)
- `einheit`/`steuersatz` noch keine FKs auf eigene Stammdaten (existieren noch nicht)
- `lieferant_id` in artikel_lieferant ohne FK-Constraint (lieferant-Tabelle existiert
  noch nicht, Kunden-/Lieferantenstamm ist eigenes offenes Modul)
- `libs/common`-Code (JWT-Guard, RBAC-Guard) hier unter `src/common/` dupliziert
  (Docker-Build-Context-Grund, siehe libs/common/src/rbac/system-rollen.const.ts) -
  Konsolidierung folgt mit echtem Nx-Build
