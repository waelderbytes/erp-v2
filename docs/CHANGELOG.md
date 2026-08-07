# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/), Versionierung
nach [Semantic Versioning](https://semver.org/lang/de/) (MAJOR.MINOR.PATCH).

Solange sich das Projekt in der Planungs-/Grundgerüst-Phase befindet (< 1.0.0), sind
auch MINOR-Versionssprünge (0.X.0) potenziell breaking – erst ab 1.0.0 gilt SemVer
im vollen Sinn.

## [Unreleased]

### Added (07.08.2026)

### Added (08.08.2026) - Artikelstamm (erstes Fachmodul)
- Neuer Service `erp-service`, eigene Migrations-Historie in derselben Tenant-DB
- Nummernkreis-Engine implementiert (generisch, Row-Lock via `SELECT ... FOR UPDATE`,
  siehe docs/architecture.md Abschnitt 6)
- Kategoriebasierte Artikelnummern (XXX-YYY-lfd, Zaehler je Haupt-/Untergruppen-
  Kombination) - `artikelkategorie` + `artikelkategorie_zuordnung`
- Firma-Singleton mit hart durchgesetzter Sperre fuer `artikelnummern_schema` sobald
  ein Artikel existiert (Verbesserung gegenueber ERP v1, siehe architecture.md)
- Artikel-Entity + CRUD (anlegen/liste/find), `artikel_lieferant` n:m mit
  Favoriten-Kennzeichen (Unique-Index: max. 1 Favorit je Artikel)
- RBAC erstmals scharf geschaltet: JwtAuthGuard + echter Berechtigungs-Abgleich
  (vorher TODO/hart abgelehnt) - Berechtigungen werden beim Login/Refresh ins JWT
  gepackt (`libs/common` JwtStrategy/RbacGuard), `modul_key = 'artikelstamm'` mit
  Sachbearbeiter (lesen+schreiben) und Lesend (lesen) verknuepft
- Repo real angelegt (github.com/waelderbytes/erp-v2), erstes Grundgeruest gepusht
- `docs/feldkatalog.md`: Feldkatalog Artikel/Kunde/Lieferant, Dokumentenanhaenge
- `docs/rbac-rollenkatalog.md`: 5 System-Rollen (Owner, Administrator, Sachbearbeiter,
  Lesend, Aussendienst), modulweise Berechtigungen (lesen/schreiben/loeschen/administrieren)
- Entscheidung: kein zentraler IdP/Keycloak, eigener JWT-Auth-Service pro Tenant-
  Deployment (Passport.js, argon2id) - siehe architecture.md Abschnitt 1
- Entscheidung: Hosting Hetzner Cloud CPX22, mehrere Tenant-Compose-Stacks auf
  gemeinsamem Host statt 1-Server-pro-Tenant - siehe architecture.md Abschnitt 8
- auth-service: echte Implementierung - Entities (Benutzer/Rolle/Berechtigung),
  Migration 0001_initial_schema (Schema, Rollen-Seed, Audit-Log-Tabelle + generischer
  DB-Trigger), Bootstrap-/Login-/Refresh-Endpoints, argon2id-Passwort-Hashing
- libs/common/src/rbac: RBAC-Guard + @Berechtigung()-Decorator (Grundgeruest, echter
  Abgleich gegen rolle_berechtigung folgt mit dem ersten Fach-Modul)
- Hinweis: npm install/Build in dieser Session NICHT verifiziert (kein Node-
  Dependency-Install durchgefuehrt) - vor erstem Deploy lokal/in Claude Code bauen und
  testen

### Verifiziert auf dem echten Server (07.08.2026)
- Server eingerichtet: Hetzner CPX22, Ubuntu 24.04, Docker, UFW, fail2ban, Deploy-User
  `waelderbytes`, root-Login deaktiviert (siehe scripts/server-setup.sh)
- Bug gefunden + behoben: Migration-Klassenname brauchte numerischen Zeitstempel-Suffix
  (TypeORM-Konvention) - `InitialSchema0001` zu `InitialSchema<epoch-ms>` korrigiert
- Migration 0001_initial_schema erfolgreich gegen echte Postgres ausgefuehrt
- Audit-Trigger funktional bestaetigt: UPDATE auf `rolle` erzeugt echten `audit_log`-Eintrag
- Bekannte Einschraenkung: REVOKE auf audit_log wirkt nicht gegen den aktuell genutzten
  DB-Owner-User - eigene eingeschraenkte DB-Rolle fuer die Services noch zu schaffen

### Added
- Projekt-Grundgerüst: Nx-Monorepo-Struktur (Platzhalter-Configs), Docker-Compose für
  lokale Entwicklung, `.env.example`
- `docs/architecture.md`: Architektur-Grundsatzentscheidungen (NestJS, PostgreSQL 1 DB
  pro Tenant, REST+OpenAPI, RabbitMQ, Docker Compose)
- `docs/module-uebersicht.md`: vollständige Modulliste, Roadmap, Cross-Cutting Concerns
- Auth-Service-Grundgerüst: `Tenant`-, `TenantModule`-, `User`-Entities (Control-Plane)
- Event-Contracts (`libs/shared/src/events/event-contracts.ts`) für RabbitMQ
- Audit-Log-Konzept: DB-Trigger-basiertes, unveränderliches Änderungsprotokoll für
  alle Entitäten (siehe architecture.md Abschnitt 4)
- Entscheidung: Artikelnummernschema XXX-YYY-lfd, laufende Nummer je Hauptgruppe,
  technische ID getrennt von sprechender Nummer
- Entscheidung: Kleinunternehmerregelung (§19 UStG) als Firmen-Flag, betrifft
  Rechnungslogik
- `Regeln.md`: Arbeitsweise/Commit-Konventionen für Claude in Coding-Sessions
- Roadmap-Anpassung: Warenwirtschaft von Phase 2 auf Phase 1 vorgezogen

## [0.1.0] – noch nicht released

Erster funktionsfähiger Stand (Nx-Workspace real initialisiert, Auth-Service startet)
– wird getaggt, sobald erreicht.
