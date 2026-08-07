# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/), Versionierung
nach [Semantic Versioning](https://semver.org/lang/de/) (MAJOR.MINOR.PATCH).

Solange sich das Projekt in der Planungs-/Grundgerüst-Phase befindet (< 1.0.0), sind
auch MINOR-Versionssprünge (0.X.0) potenziell breaking – erst ab 1.0.0 gilt SemVer
im vollen Sinn.

## [Unreleased]

### Zeiterfassung: zeiterfassung-service live verifiziert (07.08.2026)
- Auf dem Server end-to-end getestet: Migration 0001 (CREATE TABLE zeitbuchung)
  gelaufen, kommt gebucht, doppeltes kommt korrekt mit 409/Conflict abgelehnt
  ("Buchung 'kommt' ist im aktuellen Status 'eingestempelt' nicht moeglich"),
  pause_beginn -> Status korrekt 'pause', pause_ende, geht - kompletter Zyklus
  ausgestempelt->eingestempelt->pause->eingestempelt->ausgestempelt bestaetigt
- GET /zeitbuchung/heute liefert Arbeitszeit-/Pausenzeit-Berechnung korrekt,
  auch waehrend eines noch laufenden (nicht abgeschlossenen) Intervalls
- Damit ist das Zeiterfassung-Backend (Kiosk-Login + Kommt/Geht/Pause-Ledger)
  vollstaendig implementiert und live verifiziert. Offen: Frontend-UI

### Zeiterfassung: neuer zeiterfassung-service - Kommt/Geht/Pause (08.08.2026)
- Neuer eigenstaendiger NestJS-Service `apps/zeiterfassung-service`, strukturell
  identisch zu erp-service aufgebaut (eigene TypeORM-Migrationshistorie unter
  `migrations_zeiterfassung_service`, eigene JWT/RBAC-Pruefung via kopierten
  `src/common/auth` und `src/common/rbac` - selbe Docker-Build-Context-
  Einschraenkung wie bei den anderen Services, siehe architecture.md)
- Neue Entity `Zeitbuchung` (Tabelle `zeitbuchung`): unveraenderliches Ledger
  (nur INSERT, kein UPDATE/DELETE - kein Audit-Trigger noetig, das Ledger selbst
  ist der Audit-Trail), Felder typ (kommt/geht/pause_beginn/pause_ende),
  zeitpunkt, quelle (web/kiosk), optionale GPS-Koordinaten, optionaler Kommentar,
  optionale auftrag_id (noch ohne FK - Auftrag-Tabelle existiert noch nicht).
  `benutzer_id` ist ein roher FK auf `benutzer(id)` ohne TypeORM-Relation, da
  die Tabelle vom auth-service verwaltet wird (gleiche physische Tenant-DB,
  getrennte Migrationshistorien)
- Zustandsautomat verhindert unlogische Buchungsfolgen (z. B. "geht" ohne
  vorheriges "kommt", doppeltes "pause_beginn"): Statusmodell
  ausgestempelt/eingestempelt/pause mit fest hinterlegter Uebergangstabelle,
  ungueltige Uebergaenge liefern 409 Conflict
- Endpoints unter `/zeitbuchung`: POST `/stempeln`, GET `/status` (aktueller
  Zustand), GET `/heute` (Arbeitszeit/Pausenzeit-Berechnung inkl. laufendem,
  noch nicht abgeschlossenem Intervall bis "jetzt"), GET `/alle` (Admin/
  Reporting, RBAC-Berechtigung `zeiterfassung:lesen`)
- RBAC-Berechtigungen fuer modul_key `zeiterfassung` wurden bereits mit
  auth-service-Migration 0002 geseedet (sachbearbeiter: lesen+schreiben,
  aussendienst: nur schreiben - genau das noetig fuer Kiosk-Mitarbeiter ohne
  vollen ERP-Zugang, lesend: nur lesen)
- `docker-compose.yml`: neuer Service-Block `zeiterfassung-service` (Port
  3003, intern 3000), analog zu erp-service
- `apps/web/nginx.conf`: neue Route `/api/zeitbuchung/*` -> zeiterfassung-
  service, muss vor der allgemeinen `/api/*`-Regel stehen (gleiches Muster wie
  bei `/api/auth/*`)
- Lokal build-verifiziert (`tsc --noEmit` + `nest build`), noch NICHT auf dem
  Server getestet - Migration 0001 (`CREATE TABLE zeitbuchung`) steht dort noch
  aus

### Zeiterfassung: Kiosk-Login live verifiziert (08.08.2026)
- Siehe vorherigen Eintrag "Kiosk-Login fuer Zeiterfassung" fuer die
  Implementierungsdetails
- Auf dem Server end-to-end getestet: Kiosk-Geraet angelegt (Klartext-API-Key
  einmalig zurueckgegeben), Personalnummer+PIN-Hash fuer Testbenutzer gesetzt,
  POST /auth/kiosk/identifizieren liefert korrekten Access-Token samt Vor-/
  Nachname fuer die Begruessung am Tablet
- Bug gefunden + behoben (unabhaengig entdeckt): LoginDto erzwang faelschlich
  dieselbe Mindestlaenge (8 Zeichen) wie beim Anlegen eines Passworts -
  @MinLength(8) gehoert nur zum Setzen eines Passworts, nicht zur Login-Pruefung

### Frontend: erste UI fuer Warenwirtschaft (08.08.2026)
- UI-Bibliothek entschieden: shadcn/ui + Tailwind (Details siehe
  docs/module-uebersicht.md Abschnitt 1)
- apps/web von reinem Platzhalter zu echter React-App: Tailwind-Setup inkl.
  CSS-Variablen-Theming (`src/index.css`), handgeschriebene shadcn-Basis-
  komponenten (Button, Input, Label, Card, Table, Dialog, Select) unter
  `src/components/ui/`
- React Router: `/login` oeffentlich, alle anderen Routen hinter `RequireAuth`
  (clientseitige Pruefung auf gueltiges Access-Token)
- Auth (`src/lib/auth.ts`): Login, Logout, Access-/Refresh-Token in
  localStorage, automatischer Refresh-Versuch bei 401 bevor ausgeloggt wird
  (Access-Token laeuft nach 15 Minuten ab)
- API-Client (`src/lib/api.ts`): zentraler fetch-Wrapper gegen `/api/*`
- Screens (Liste + Anlegen): Artikel, Kunden, Lieferanten, Lager (inkl.
  Wareneingang/Warenausgang buchen + Bestandsanzeige je Artikel), Bestellungen
  (inkl. Bestellen-Aktion + Wareneingang je Position), Preise (inkl. "Preis
  ermitteln"-Testwerkzeug)
- Technische Schuld bewusst dokumentiert: `api-gateway` ist weiterhin ein leerer
  Stub, nginx im web-Container uebernimmt vorerst das Routing zu
  auth-service/erp-service (siehe apps/web/nginx.conf) - echtes Gateway mit
  Auth-Vorpruefung/Rate-Limiting folgt vor Produktivbetrieb mehrerer Tenants
- Verifiziert lokal: npx tsc --noEmit + npm run build (tsc + vite build)
  erfolgreich, Bundle 324 KB / 103 KB gzip

### Artikel: Herstellerartikelnummer ergaenzt (08.08.2026)
- Nutzeranfrage: Herstellerartikelnummer (MPN) fehlte komplett, obwohl in
  feldkatalog.md Abschnitt 1.2 vorgesehen - nie umgesetzt
- Neue Spalten `artikel.hersteller` / `artikel.hersteller_artikelnummer`
  (Migration 0007), global eindeutig per partiellem Unique-Index (NULL bleibt
  erlaubt), verhindert doppelt angelegte Artikel fuer dasselbe Produkt
- `POST /artikel` liefert bei Duplikat jetzt eine klare 409-Fehlermeldung statt
  eines rohen 500ers (Postgres unique_violation abgefangen)

### Preisfindung live verifiziert (08.08.2026)
- Neue Endpoints: `POST /preise`, `GET /preise/artikel/:artikelId`, `GET
  /preise/ermitteln?artikelId=&menge=&kundeId=&datum=`
- Migration 0006_preisfindung: `artikelpreis`-Tabelle (Staffelpreise,
  kundenspezifische Preise, Aktionspreise ueber eine Tabelle), RBAC-Seed
  modul_key 'preisfindung'
- Auf dem Server getestet: Basispreis (19.90) + Staffelpreis ab Menge 10 (16.50)
  angelegt, Ermittlung liefert bei Menge 5 den Basispreis, bei Menge 15 korrekt
  den Staffelpreis
- Damit ist Phase 1 (Warenwirtschaft: Artikel, Kunde/Lieferant, Lager, Einkauf,
  Preisfindung) vollstaendig implementiert und live verifiziert

### Einkauf/Bestellwesen live verifiziert (08.08.2026)
- Neue Endpoints: `GET/POST /bestellungen`, `GET /bestellungen/:id`, `POST
  /bestellungen/:id/bestellen`, `POST /bestellungen/wareneingang`
- Migration 0005_einkauf_bestellwesen: `bestellung`, `bestellposition`, generische
  `referenz_typ`/`referenz_id`-Spalten auf `lagerbewegung` (Rueckverfolgbarkeit zur
  Bestellposition), RBAC-Seed modul_key 'einkauf'
- Wareneingang-Buchung atomar: Lieferstatus der Position (`gelieferte_menge`) und
  echter Lagerbestand werden in derselben Transaktion fortgeschrieben,
  Bestellstatus wird automatisch neu berechnet (offen -> bestellt ->
  teilweise_geliefert -> abgeschlossen), Ueberlieferung wird mit klarer
  400-Fehlermeldung abgelehnt
- Bug VOR dem ersten Server-Deploy gefunden und behoben: `LagerModule`
  exportierte `LagerbewegungService` nicht - haette zu einem Laufzeit-DI-Fehler
  beim Start von `EinkaufModule` gefuehrt, war durch `tsc`/`nest build` nicht
  erkennbar (reiner Nest-Dependency-Injection-Fehler), per Code-Review vor dem
  Deploy gefunden
- Auf dem Server end-to-end getestet: Bestellung anlegen (Nummer '00001'),
  bestellen, Teillieferung (20 von 50, Status -> teilweise_geliefert),
  Ueberlieferung (40 von restlichen 30) korrekt mit 400 abgelehnt, Restlieferung
  (30) -> Status abgeschlossen, Endbestand per direkter DB-Abfrage bestaetigt
  (62.000 im Zullager)

### Lagerverwaltung live verifiziert (08.08.2026)
- Neue Endpoints: `GET/POST /lager`, `GET /lager/:id/bestand`, `GET
  /lager/artikel/:artikelId/bestand`, `POST /lagerbewegung/wareneingang`, `POST
  /lagerbewegung/warenausgang`, `POST /lagerbewegung/umbuchung`, `POST
  /lagerbewegung/inventur`
- Migration 0004_lagerverwaltung: `lager`, `lagerbestand` (UNIQUE artikel_id+
  lager_id), `lagerbewegung` (unveraenderliches Ledger, vorzeichenbehaftetes
  Delta), partieller Unique-Index fuer "hoechstens 1 Standardlager", RBAC-Seed
  modul_key 'lager'
- Buchungslogik race-condition-sicher per Row-Lock (`SELECT ... FOR UPDATE`),
  gleiches Muster wie die Nummernkreis-Engine
- Auf dem Server end-to-end getestet: Lager anlegen, Wareneingang (25),
  Bestandsgrenze bei Warenausgang korrekt mit 409/ConflictException abgelehnt
  (nicht 500), Umbuchung zwischen zwei Lagern (zwei verknuepfte Bewegungszeilen
  ueber umbuchung_gruppe_id), Inventurkorrektur mit korrekt berechnetem Delta -
  Endbestand per direkter DB-Abfrage bestaetigt (12.000 / 10.000)

### Kunden-/Lieferantenstamm live verifiziert (08.08.2026)
- Neue Endpoints: `POST /kunden`, `GET /kunden`, `GET /kunden/:id`, `POST
  /kunden/:id/bewertungen`, `GET /kunden/:id/bewertungen`, `POST /lieferanten`, `GET
  /lieferanten`, `GET /lieferanten/:id`
- Neue Endpoints Artikel-Lieferant-Zuordnung (fehlten bisher komplett): `POST
  /artikel/:id/lieferant` (Zuordnung anlegen), `GET /artikel/:id/lieferant` (Liste),
  `POST /artikel/:id/lieferant/:zuordnungId/favorit` (bestehend, jetzt sinnvoll nutzbar)
- Migration 0002_kunden_lieferantenstamm: kunde/kunde_adresse/kunde_kontakt/
  bewertungskriterium (geseedet)/kunde_bewertung/lieferant/lieferant_adresse/
  lieferant_kontakt, `artikel_lieferant.lieferant_id` als echter FK
- Migration 0003_artikel_lieferant_unique: UNIQUE(artikel_id, lieferant_id) auf
  `artikel_lieferant` (fehlte bisher, ermoeglichte Duplikate), inkl. Bereinigung
  vorhandener Duplikate vor Anlage der Constraint
- Auf dem Server end-to-end getestet: Kunde mit Adresse anlegen (Nummernkreis
  vergibt Kundennummer korrekt), Lieferant anlegen (Lieferantennummer korrekt),
  Artikel-Lieferant-Zuordnung anlegen, als Favorit setzen - per direkter DB-Abfrage
  bestaetigt
- Bug gefunden + behoben: Migrations-Glob in `data-source.ts` matchte nur `*.ts`,
  fand im kompilierten `dist/`-Ordner (nur `.js`-Dateien) daher keine einzige
  Migration - `migration:run:prod` meldete faelschlich "No migrations are pending",
  obwohl Migration 0002 nie angewendet war. Fix: Glob auf `*.{ts,js}` erweitert
  (auth-service + erp-service)
- Bug gefunden + behoben: fehlendes `@JoinColumn` auf mehreren `@ManyToOne`-Relationen
  (`artikel_lieferant`, `kunde_adresse`, `kunde_kontakt`, `kunde_bewertung`,
  `lieferant_adresse`, `lieferant_kontakt`, `artikelkategorie_zuordnung`) fuehrte zu
  `QueryFailedError: column "artikelId" of relation "artikel_lieferant" does not
  exist` - TypeORM legt ohne explizites `@JoinColumn` eine zusaetzliche implizite
  Join-Spalte an (camelCase-Namensschema), die nie migriert wurde. Kunde/Lieferant-
  Anlegen war davon nicht betroffen, weil dort ueber kaskadierendes Speichern
  (Relation als Objekt) statt ueber direktes Setzen des Skalar-FKs gearbeitet wurde -
  `kunde_bewertung.bewerten()` haette denselben Fehler gehabt, war nur noch nicht
  getestet, daher proaktiv mitgefixt
- `docs/Regeln.md`/`CLAUDE.md`: Abschnitt 0a (Umgang mit GitHub-PAT ueber Sessions
  hinweg, Nutzerentscheidung) und Ergaenzung zu Abschnitt 1a (Server-Befehle immer in
  Code-Bloecken mit Sprachangabe ```bash``` fuer korrekte Syntax-Highlighting)

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

### Kompletter Stack live verifiziert (07.08.2026)
- Alle 4 Service-Container (auth-service, erp-service, api-gateway, web) gebaut und
  gestartet - dabei 3 echte Bugs gefunden und behoben, die in dieser Session vorher
  nicht auffielen (weil kein 'docker compose build' gegen echtes Docker/Postgres
  moeglich war): fehlendes tsconfig.json in api-gateway, fehlende index.html in web,
  DATABASE_URL zeigte auf 'localhost' statt Service-Namen 'postgres' (Container-
  interne Netzwerkaufloesung)
- End-to-End-Test erfolgreich: POST /auth/bootstrap -> POST /auth/login -> JWT mit
  Rollen/Berechtigungen -> POST /artikel (erp-service, anderer Service/Container) mit
  Bearer-Token -> Artikel angelegt, Nummernkreis vergibt korrekt '00001'
- Bootstrap-Sperre bestaetigt: zweiter Bootstrap-Versuch wird mit 409 abgelehnt

### Added (08.08.2026) - Kunden-/Lieferantenstamm
- Kunde/Lieferant-Entities inkl. Adressen (n:1), Kontakte (n:1), Kundenbewertung
  (Sterne je Kriterium, Kriterien-Katalog `bewertungskriterium` mit Default-Seed:
  Zahlungsmoral/Zuverlaessigkeit/Kommunikation)
- Nummernkreis-Anbindung fuer kundennummer/lieferantennummer (generische Engine
  wiederverwendet, entity_key 'kunden'/'lieferanten' bereits seit Migration 0001 da)
- `artikel_lieferant.lieferant_id` von loser Spalte zu echtem FK auf `lieferant(id)`
  nachgezogen (Migration 0002)
- RBAC-Seed fuer modul_key 'kunden'/'lieferanten' (Sachbearbeiter lesen+schreiben,
  Lesend nur lesen)
- Verifiziert: TypeScript-Kompilierung + Nest-Build fehlerfrei - echte DB-Migration
  auf dem Server noch zu testen

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
