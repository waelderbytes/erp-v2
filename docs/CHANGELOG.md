# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/), Versionierung
nach [Semantic Versioning](https://semver.org/lang/de/) (MAJOR.MINOR.PATCH).

Solange sich das Projekt in der Planungs-/Grundgerüst-Phase befindet (< 1.0.0), sind
auch MINOR-Versionssprünge (0.X.0) potenziell breaking – erst ab 1.0.0 gilt SemVer
im vollen Sinn.

## [Unreleased]

### Proformarechnungen/Abschlagsrechnungen + kategoriebasierte Artikelnummern fertiggestellt (08.08.2026)
- Nutzerforderung (Kundendemo, dringend): zwei bislang offene Luecken
  geschlossen
- **Proforma/Abschlag**: neue `BelegTyp`-Werte, entstehen ausschliesslich
  als Zusatzbeleg aus einer Auftragsbestaetigung (neue Methode
  `BelegService.zusatzbeleg()`), bewusst NICHT Teil der normalen
  `uebernehmen()`-Kette - beeinflussen weder `weitergefuehrteMenge` noch den
  Status der Auftragsbestaetigung (unverbindliche/ergaenzende Kopien,
  mehrfach moeglich, z. B. Teilzahlungsraten). Zwei neue Nummernkreise
  (proformarechnungen/abschlagsrechnungen). `abschlag` ist wie `rechnung`
  festschreibbar (echte GoBD-relevante Anzahlungsrechnung), `proforma`
  ausdruecklich nicht. Migration 0017 (noch nicht deployed) direkt erweitert
  statt neuer Migration. Feldschema-Idee an v1s `zusatz_nachfolger`
  angelehnt, der Ablauf ist bewusst neu entworfen.
- **Kategoriebasierte Artikelnummern (Ober-/Untergruppe)**: bisher gab es
  nur die Nummernvergabe selbst (`ArtikelNummerService`), keine Moeglichkeit,
  Haupt-/Untergruppen anzulegen. Neues CRUD (`ArtikelkategorieService`/
  `-controller`, modul_key `stammdaten`) + neuer Tab "Artikel-Warengruppen"
  in den Stammdaten + Hauptgruppe/Untergruppe-Auswahl mit Live-Vorschau der
  naechsten Nummer im Artikel-Anlegen-Formular (nur bei
  `artikelnummernSchema === 'kategorie'`, nur beim Anlegen aenderbar)

### Design-Update: Optik an Referenzbildern orientiert (08.08.2026)
- Nutzerwunsch: grafisch/strukturell annaehern, Farbschema unveraendert
  (nur bestehende CSS-Variablen genutzt, kein neuer Farbwert)
- Card: duenner farbiger Top-Akzent, CardTitle als kleine Uppercase-Eyebrow
  statt grossem h3 (wirkt global auf allen Card-Abschnittsheadern)
- Tabs: unterstrichener Stil statt Segment-/Pill-Optik
- Neue PageHeading-Komponente (Eyebrow = Navigationsgruppe + fetter Titel)
  auf allen 9 Listen-/Uebersichtsseiten sowie Artikel-Detail
- TableHead: Spaltenkoepfe klein/uppercase/tracking-wide
- Sidebar: Markenblock oben, Benutzerblock unten (E-Mail+Rolle), aktiver
  Navigationspunkt mit linkem Farbakzent

### Modul Belegkette (Verkauf): Angebot -> Auftragsbestaetigung -> Lieferschein -> Rechnung (08.08.2026)
- Nutzerentscheidung: gemeinsames Beleg+Beleg-Position-Datenmodell (Feld-
  schema an ERP v1 angelehnt), Ablauf/Teillieferungslogik aber bewusst NEU
  entworfen und NICHT aus v1 uebernommen ("wir sollten uns nicht zu nah am
  v1 orientieren ... nicht fuer Ablaeufe") - v1 hatte z. B. keine echte
  Teillieferung/-rechnung, nur 1:1-Vollkopie beim Umwandeln
- Migration 0017: Tabellen `beleg`/`beleg_position`, vier neue
  Nummernkreise (angebote/auftragsbestaetigungen/lieferscheine/rechnungen)
- Echte Teillieferung/-rechnung: `weitergefuehrte_menge` pro Position
  (analog `bestellposition.gelieferte_menge`), Status automatisch
  offen/teilweise_weitergefuehrt/abgeschlossen/storniert
- Preis-/Steuersatz-Snapshot pro Position beim Anlegen/Uebernehmen
  eingefroren (GoBD-Gedanke) - Preisfindung wird automatisch herangezogen,
  wenn kein manueller Preis angegeben wird
- Lieferschein-Anlage bucht automatisch Warenausgang (neue Methode
  `warenausgangInTransaktion` in `lagerbewegung.service.ts`, analog
  `wareneingangInTransaktion`)
- `festgeschrieben`-Flag fuer GoBD-Unveraenderlichkeit bei Rechnungen
  (manueller Endpoint - PDF-Kopplung bewusst als Folgeschritt
  zurueckgestellt)
- Neuer RBAC-`modul_key` "verkauf" fuer alle vier Belegtypen
- Frontend: neue Nav-Gruppe "Vertrieb", generische Listen-/Detail-
  Komponenten fuer alle vier Belegtypen (Positionen-Editor mit Artikel-
  oder Freitext-Zeilen, Uebernehmen-Dialog mit Teilmengen-Auswahl,
  Kleinunternehmer-bewusste Summenanzeige)
- Verifiziert lokal: erp-service (`tsc --noEmit`, `nest build`), web
  (`tsc --noEmit`, `vite build`) - alle fehlerfrei. Migration 0017 lokal
  nicht gegen echte Postgres-DB testbar (Sandbox ohne Docker/Postgres)

### Modul Stammdaten/System-Einstellungen (08.08.2026)
- Nutzerentscheidung: erstmal 1 Firma (kein Mehrfirmen-Umbau) - Firma bleibt
  Singleton (id=1)
- Migration 0014: neue Tabelle `steuersatz` (Bezeichnung/Satz/aktiv/
  ist_standard), Seed 19%/7%/0% (Regelsteuersatz = Standard)
- Migration 0015: `artikel.steuersatz_id` als echte Pflicht-FK (vorher nur
  ein Kommentar im Entity-Code) - Backfill bestehender Artikel auf den
  Standard-Steuersatz, danach `NOT NULL`. Damit ist die letzte in
  feldkatalog.md offene Pflichtfeld-Lücke geschlossen
- Migration 0016: `firma` um echte Firmenstammdaten erweitert (Name,
  Anschrift, USt-IdNr., Steuernummer, Telefon, E-Mail,
  `kleinunternehmer`-Flag § 19 UStG, Default `true`)
- Neue Endpoints: `GET/PATCH /firma`, `POST /firma/artikelnummern-schema`,
  `PATCH /firma/artikelnummern-stellen`, `GET/POST/PATCH /steuersaetze`,
  `GET/PATCH /nummernkreise/:entityKey` - alle unter neuem RBAC-`modul_key`
  `stammdaten` (siehe rbac-rollenkatalog.md), ohne explizite Rollenvergabe
  praktisch Owner/Administrator vorbehalten (RbacGuard-Bypass)
- `NummernkreisService.aktualisieren()`: Präfix/Stellenanzahl jederzeit
  änderbar, Startwert nur solange der Kreis unbenutzt ist (`next_value ===
  start_value`), siehe architecture.md Abschnitt 6
- Frontend: neue Seite „Stammdaten“ (Firma/Steuersätze/Nummernkreise-Tabs),
  Steuersatz-Pflichtfeld-Dropdown im Artikel-Stammdaten-Tab (vorbelegt mit
  Standard-Steuersatz beim Neuanlegen)
- Verifiziert lokal: erp-service (`tsc --noEmit`, `nest build`), web
  (`tsc --noEmit`, `vite build`) - alle fehlerfrei

### Reset- und Seed-Skript für Testdaten (08.08.2026)
- `scripts/reset-testdaten.sql`: leert nur Bewegungsdaten (Artikel, Kunden,
  Lieferanten, Lagerbestände/-bewegungen, Bestellungen) - Firma, Einheiten,
  Steuersätze, Nummernkreis-Konfiguration und Lager-Stammdaten bleiben
  erhalten, `nummernkreis.next_value` wird auf den Startwert zurückgesetzt.
  Audit-Log wird NICHT pauschal geleert (bewusst unveränderlich, siehe
  architecture.md Abschnitt 5) - nur die Einträge zu den geleerten Tabellen
  werden scoped gelöscht
- `apps/erp-service/src/database/seed-testdaten.ts`
  (`npm run seed:testdaten` / `seed:testdaten:prod`): legt Testdaten über die
  echten Services an (Nummernkreis-Vergabe, Pflichtfelder), jederzeit
  wiederholt ausführbar, keine rohen SQL-Inserts

### Letzte Feldkatalog-Lücken bei Artikel nachgezogen (08.08.2026)
- Migration 0013: `gewicht_kg`, `laenge_mm`/`breite_mm`/`hoehe_mm`,
  `mindestbestand` - alle optional (Standard-Erweiterungsfelder laut
  feldkatalog.md, kein Pflichtfeld wie `steuersatz_id`)
- `mindestbestand` bewusst ohne Service-seitige Erzwingung - reine
  Zusatzinfo, im Frontend nur sichtbar wenn "Bestandsgeführt" aktiv ist
- Frontend: Masse als 4er-Grid im Stammdaten-Tab, Log-Tab-Feldlabels ergänzt
- Verifiziert lokal: erp-service (`tsc --noEmit`, `nest build`), web
  (`tsc --noEmit`, `vite build`) - alle fehlerfrei. Commits `98031b1`
  (Backend), `999094e` (Frontend), gepusht

### Fix: Log-Tab zeigte UUID statt Benutzername (08.08.2026)
- Nutzer-Report: "Benutzer nicht aufgeschlüsselt, manchmal -"
- Ursache 1 (behoben): Lagerbuchungen zeigten die rohe `gebuchtVon`-UUID -
  Log-Tab lädt jetzt zusätzlich `GET /benutzer` und löst über eine Karte
  id→Name/E-Mail auf (fällt bei 403 - nicht Owner/Administrator - auf die
  rohe UUID zurück statt abzustürzen)
- Ursache 2 (dokumentiert, bewusst NICHT gefixt): das "-" bei Audit-
  Einträgen ist kein Anzeigefehler - `audit_log.changed_by` ist seit der
  allerersten auth-service-Migration IMMER NULL, weil kein Service jemals
  `SET LOCAL app.current_user_id` setzt. Vorbestehende, projektweite
  Architektur-Lücke, korrekter Fix bräuchte Request-weite Transaktionen
  über praktisch alle Schreibpfade - nach Rückfrage bewusst zurückgestellt,
  siehe session-handoff.md
- Verifiziert lokal: `tsc --noEmit`, `vite build` (beide fehlerfrei).
  Commit `c6ac11c`, gepusht

### Stückliste (BOM), mehrstufig (08.08.2026)
- Nutzerentscheidung nach Rückfrage (siehe Chat-Verlauf): volle mehrstufige
  Variante, feste Menge pro Position (kein Verschnitt-Feld), nur echte
  Artikel-Positionen (keine Text-/Titelzeilen), Baumansicht + druckbare
  komplett aufgelöste Strukturstückliste von Anfang an
- Backend: Migration 0012 (`stueckliste_position`, selbstreferenzierend über
  `artikel`), Zirkelbezug-Schutz per BFS vor dem Insert (nicht per
  DB-Constraint möglich), nur Fertigungsartikel dürfen eine Stückliste haben
- Backend: `GET/POST /artikel/:id/stueckliste`,
  `PATCH/DELETE .../stueckliste/:positionId`,
  `GET .../stueckliste/aufgeloest` (rekursive Baumstruktur mit effektiver
  Gesamtmenge je Ebene)
- Frontend: neuer Tab "Stückliste" (nur bei bomfähigen Fertigungsartikeln
  aktiv), editierbare direkte Positionen, aufklappbare Nur-Ansicht für
  verschachtelte Unter-Stücklisten, "Strukturstückliste drucken" (eigenes
  Druckfenster mit komplett aufgelöster Baumstruktur)
- Verifiziert lokal: erp-service (`tsc --noEmit`, `nest build`), web
  (`tsc --noEmit`, `vite build`) - alle fehlerfrei. Migration selbst konnte
  lokal nicht gegen eine echte DB getestet werden (Sandbox ohne Postgres).
  Commits `5cf5383` (Backend), `83bb523` (Frontend), gepusht

### bomfaehig-Flag nachgezogen (08.08.2026)
- Feldkatalog-Abgleich hatte eine Luecke aufgedeckt: `bomfaehig` war laut
  Doku "bereits vorgesehen", existierte aber nicht in der Entity - vorab
  nachgezogen, da der naechste Roadmap-Punkt (Stueckliste/BOM) darauf
  aufbaut
- Migration 0011: `artikel.bomfaehig BOOLEAN NOT NULL DEFAULT false`, nur
  bei `artikelart = 'fertigungsartikel'` wirksam (Service-seitig erzwungen,
  gleiches Muster wie `bestandsgefuehrt`)
- Frontend: Checkbox "Stücklistenfähig" im Stammdaten-Tab
- Verifiziert lokal: erp-service (`tsc --noEmit`, `nest build`), web
  (`tsc --noEmit`, `vite build`) - alle fehlerfrei. Commit `2bff571`,
  gepusht

### PWA-Installierbarkeit (08.08.2026)
- `vite-plugin-pwa` aktiviert (war als Dependency vorhanden, aber noch nicht
  verdrahtet) - Manifest + Service Worker (nur App-Shell precached, bewusst
  kein Runtime-Caching von API-Antworten)
- Platzhalter-Icons generiert (Nutzerentscheidung: kein eigenes Logo),
  Farbe aus `--primary`: icon-192/512/512-maskable, apple-touch-icon,
  favicon.ico
- Verifiziert lokal: `tsc --noEmit`, `vite build` (fehlerfrei, SW + Manifest
  werden erzeugt). Commit `adfafe4`, gepusht

### Artikel Log-Tab + Bestand-Tab immer sichtbar (08.08.2026)
- Backend: `GET /artikel/:id/log` (neuer `ArtikelLogService`) liefert
  Audit-Trail (`audit_log`, roh per DataSource-Query gelesen statt eigener
  Entity - Tabelle gehoert der auth-service-Migration) + Lagerbuchungen
  (bestehendes `lagerbewegung`-Ledger) kombiniert
- Frontend: neuer Tab "Log", chronologisch sortiert, Checkbox "Nur Buchungen
  anzeigen" blendet reine Aenderungs-Eintraege aus. UPDATE-Eintraege zeigen
  die tatsaechlich geaenderten Feldnamen (Diff alt/neu)
- Frontend: "Bestand"-Tab ist jetzt IMMER in der Tab-Liste sichtbar, nur
  ausgegraut wenn der Artikel nicht bestandsgefuehrt ist (vorher komplett
  ausgeblendet, z.B. bei Dienstleistungen). Weiter/Zurueck-Navigation
  ueberspringt deaktivierte Tabs automatisch
- Verifiziert lokal: erp-service (`tsc --noEmit`, `nest build`), web
  (`tsc --noEmit`, `vite build`) - alle fehlerfrei. Commits `3fc7d1f`
  (Backend), `5004a24` (Frontend), gepusht

### Fix: Migrationslauf schlug fehl - Einheit-Entity fehlte in data-source.ts (08.08.2026)
- Serverfehler beim Deploy des Einheiten-Moduls: "Entity metadata for
  Artikel#einheit was not found" beim `migration:run:prod`
- Root Cause: `src/database/data-source.ts` (eigene DataSource nur fuer den
  Migrations-CLI-Lauf) hatte eine von `app.module.ts` komplett getrennte
  `entities`-Liste, dort fehlte die neue `Einheit`-Entity
- Dritte Stelle zur bekannten DI-Wiring-Fehlerklasse ergaenzt (siehe
  session-handoff.md): Modul-`forFeature()`, globale `app.module.ts`-Liste,
  UND `data-source.ts`-Liste muessen bei jeder neuen Entity mit Relation
  geprueft werden
- Verifiziert lokal: `tsc --noEmit`, `nest build` (beide fehlerfrei),
  Commit `5c81fe7`, gepusht - Migrationslauf selbst konnte lokal nicht gegen
  eine echte DB getestet werden (Sandbox ohne Postgres)

### Einheiten-Modul + Such-/Anlegen-Dropdown + Kurztext-Vorschlaege (08.08.2026)
- Nutzerentscheidung: Einheit im Artikel-Wizard soll konsistent/erweiterbar
  sein statt Freitext -> echtes Einheiten-Modul (Vorbild ERP v1) statt
  statischer Frontend-Liste gewaehlt (zieht kleinen Teil des noch offenen
  Moduls "Stammdaten/System-Einstellungen" vor)
- Backend: neue Tabelle `einheit` (code/name/aktiv/dezimalstellen) inkl.
  Audit-Trigger und Seed gaengiger Standard-Einheiten (Migration 0009);
  `GET/POST /einheiten`, `DELETE /einheiten/:id` (Soft-Delete); modul_key
  vorerst `artikelstamm`
- Backend: `artikel.einheit` (Freitext) ersetzt durch `artikel.einheit_id`
  als echte FK auf `einheit.id` (Migration 0010), Bestandsdaten per
  Code-Abgleich automatisch migriert
- Frontend: neue generische Komponente `SearchCreateDropdown` (tippen
  filtert, "+ anlegen" bei keinem Treffer) 1:1 nach ERP-v1-Vorbild - bewusst
  domainfrei, Ausgangspunkt fuer kuenftige Dropdowns
- Frontend: Einheit-Feld nutzt das neue Dropdown inkl. Anlegen-Popup
  (Code/Name/Nachkommastellen) und Deaktivieren direkt aus der Liste
- Frontend: Kurztext zeigt waehrend des Tippens Vorschlaege aus vorhandenen
  Artikeln (Duplikat-Vermeidung), reine Anzeige-Hilfe, keine Pflichtauswahl
- Verifiziert lokal: erp-service (`npm install --ignore-scripts`,
  `tsc --noEmit`, `nest build`), web (`tsc --noEmit`, `vite build`) - alle
  fehlerfrei. Commits `c9cc6d8` (Backend), `cd556b5` (Frontend), gepusht

### Artikel-Assistent: Tabs sichtbar + Weiter/Zurueck-Fuehrung (08.08.2026)
- Nutzerwunsch: geführtere UX beim Artikel-Anlegen, ohne die
  Speichern-zuerst-Notwendigkeit aufzugeben (Preise/Lieferant-Zuordnung/
  Sprachen/Bestand haengen per FK an einer echten artikel_id, Bestand ist
  zusaetzlich eine echte Lagerbuchung - kein Frontend-Entwurf moeglich)
- Entscheidung nach Ruecksprache (zwei Optionen vorgelegt, siehe Chat-Verlauf):
  Option B gewaehlt - Struktur/Backend unveraendert, nur Frontend-Navigation
  verbessert
- Frontend: alle Tabs (Bestand/Preise/Lieferanten/Sprachen) von Anfang an in
  der TabsList sichtbar statt erst nach dem Speichern eingeblendet, aber
  `disabled` + Tooltip "Bitte zuerst Stammdaten speichern", solange kein
  Artikel existiert
- Frontend: Weiter/Zurueck-Buttons unterhalb der Tabs; nach dem ersten
  Speichern der Stammdaten automatischer Sprung zum naechsten Tab
  (Bestand falls bestandsgefuehrt, sonst Preise)
- Verifiziert lokal: `tsc --noEmit`, `vite build` (beide fehlerfrei),
  Commit `57fd72b`, gepusht

### Fix: "Artikel neu" haengt bei "Laedt..." fest (07.08.2026)
- Root Cause gefunden (Bug aus session-handoff.md): Route `artikel/neu` in
  `App.tsx` hatte keinen `:id`-Parameter, `useParams().id` lieferte bei
  `/artikel/neu` daher `undefined` statt `"neu"` - `istNeu` wurde faelschlich
  `false`, der Render-Guard blieb dauerhaft im Ladezustand haengen (kein
  Request, kein Fehler - deckt sich mit den Beobachtungen ohne Konsolen-/
  Network-Auffaelligkeiten)
- Fix: redundante Route entfernt, `artikel/:id` matcht `/artikel/neu`
  ebenfalls und liefert korrekt `id="neu"`
- Verifiziert lokal: `npm install --ignore-scripts`, `tsc --noEmit`,
  `vite build` (alle fehlerfrei), Commit `07ec16a`, gepusht

### Mehrsprachigkeit Kurztext/Langtext + interne Notiz + Artikel-Assistent (07.08.2026)
- Nutzerwunsch, Referenz ERP v1 (`waelderbytes-suite`, GitHub) auf Bitte
  geklont und ausgewertet (Migration `0018_mehrsprachigkeit_interne_notiz.py`,
  `ArtikelWizard.tsx`): Datenmodell und UI-Muster 1:1 uebernommen, da dort
  bereits bewaehrt
- Backend: Migration 0008 - `artikel.interne_notiz` (rein intern, erscheint
  nie auf Belegen, bewusst einsprachig), neue Tabelle `artikel_uebersetzung`
  (artikel_id, sprache, kurztext, langtext, UNIQUE(artikel_id, sprache),
  Audit-Trigger). 'de' bleibt bewusst DIREKT auf `artikel.bezeichnung`/
  `beschreibung` - die neue Tabelle haelt nur ZUSAETZLICHE Sprachen
- Backend: neue Endpoints `GET/PUT/DELETE /artikel/:id/uebersetzungen(/:sprache)`,
  PUT-Upsert keyed auf (artikelId, sprache aus der URL) statt eigener
  Uebersetzungs-id (gleiches Muster wie v1). Sprache 'de' wird hier bewusst
  mit 409 abgelehnt (dafuer die Basisfelder verwenden)
- Backend: `kunde.sprache` existierte als Spalte bereits (Default 'de'), war
  aber nicht im Anlegen-DTO nutzbar - ergaenzt. Bestimmt spaeter (Belegkette,
  Phase 3, noch nicht gebaut) welche Artikel-Uebersetzung fuer einen Kunden
  gezogen wird
- Frontend: kein separater Anlegen-Dialog mehr fuer Artikel. Neue Route
  `/artikel/neu` nutzt denselben Tab-Screen wie das Bearbeiten
  (`ArtikelDetail.tsx`) - Tab "Stammdaten" speichert (POST beim ersten Mal,
  danach PATCH), erst danach schalten sich Bestand/Preise/Lieferanten/
  Sprachen frei (v1-Muster: "Speichere den Artikel zuerst..."). Nach dem
  Anlegen automatischer Wechsel von `/artikel/neu` auf `/artikel/:id`
  (`navigate(..., { replace: true })`), damit ein Reload nicht wieder im
  Anlegen-Modus landet
- Frontend: neuer Tab "Sprachen" - Sprachen-Tabs-UI (Klick auf Sprachcode,
  "+ Sprache" zum Hinzufuegen, Kurztext/Langtext-Felder, Speichern/Entfernen
  je Sprache), direkt nach dem UX-Muster aus v1s `UebersetzungenBlock`
  nachgebaut
- Frontend: "Interne Notiz" als eigenes Textfeld im Tab "Stammdaten"
  (getrennt von "Langtext", das auf Belegen landen kann)
- Frontend: Kunde-Anlegen-Dialog um Sprache-Feld ergaenzt (Default "de")
- Verifiziert lokal: erp-service `tsc --noEmit` + `nest build`, web `tsc
  --noEmit` + `vite build` (Bundle 361 KB / 111 KB gzip), alle fehlerfrei

### UI-Politur Warenwirtschaft, Fokus Artikel (07.08.2026)
- Backend: `PATCH /artikel/:id` (neuer Endpoint, bisher konnte ein Artikel nach
  dem Anlegen gar nicht mehr geaendert werden) - `ArtikelAktualisierenDto`,
  bewusst ohne artikelart/hauptgruppeId/untergruppeId (Artikelart-Wechsel nach
  dem Anlegen wuerde die Bestandsfuehrungs-/Nummernkreislogik verkomplizieren,
  fuer die erste Version nicht vorgesehen)
- Backend: `einheit`/`eanGtin` fehlten bisher komplett in
  `ArtikelAnlegenDto`, obwohl beide Spalten laengst in der Artikel-Entity
  existierten - ergaenzt
- Frontend: neue Artikel-Detailseite (`routes/artikel/ArtikelDetail.tsx`,
  Route `/artikel/:id`) mit vier Tabs (`components/ui/tabs.tsx` neu gebaut,
  Radix-Dependency war installiert, aber noch nicht als Komponente
  verdrahtet) - Stammdaten (Bearbeiten-Formular), Bestand (Anzeige +
  Wareneingang/Warenausgang direkt buchen), Preise (Anzeige +
  Preis anlegen), Lieferanten (Zuordnung + Favorit setzen). Ersetzt damit fuer
  den Artikel-Kontext die bisherige Notwendigkeit, zwischen Artikel-, Lager-
  und Preise-Seite hin- und herzuspringen - Wunsch aus der ersten UI-Runde
- Frontend: Artikel-Anlegen-Dialog um Beschreibung, Einheit, EAN/GTIN,
  Bestandsgefuehrt-Checkbox erweitert (vorher nur Artikelart/Bezeichnung/
  Hersteller/Hersteller-Art.-Nr.)
- Frontend: Artikel-Tabelle jetzt sortierbar (Klick auf Spaltenkopf) und
  durchsuchbar (Freitext ueber Nummer/Bezeichnung/Hersteller/EAN); Zeilen
  klickbar -> Detailseite. Kunden- und Lieferanten-Tabelle ebenfalls
  durchsuchbar gemacht (gleiches Bedienmuster)
- Bei der Recherche fuer diese Aenderung eine bestehende Luecke entdeckt und
  dokumentiert (nicht Teil dieser Aenderung, siehe module-uebersicht.md):
  die kategoriebasierte Artikelnummern-Vergabe (Schema 'kategorie') ist im
  Backend-Code fertig implementiert (`ArtikelNummerService`,
  `FirmaService.setArtikelnummernSchema()`), aber es existiert kein
  `firma.controller.ts` und keine Artikelkategorie-Endpoints - das Schema ist
  aktuell technisch nicht erreichbar, gehoert zum noch offenen Modul
  "Stammdaten/System-Einstellungen"
- Verifiziert lokal: erp-service `tsc --noEmit` + `nest build`, web `tsc
  --noEmit` + `vite build` (Bundle 359 KB / 110 KB gzip), alle fehlerfrei

### Frontend: UI fuer Benutzerverwaltung + Zeiterfassung (07.08.2026)
- Neue Nav-Gruppen "Zeiterfassung" und "Verwaltung" in apps/web (siehe
  Layout.tsx) - "Verwaltung" (Benutzer) ist bewusst nur fuer Owner/
  Administrator sichtbar (`nurAdmin`-Flag), rein clientseitige UX-Verbesserung,
  keine Sicherheitsgrenze (die eigentliche Durchsetzung bleibt serverseitig
  per RbacGuard)
- Neuer Screen `routes/benutzer/BenutzerListe.tsx`: Tabelle aller Benutzer,
  Anlegen-Dialog (E-Mail/Passwort/Name + optionale Rollenauswahl per
  Checkboxen), Bearbeiten-Dialog mit drei Bereichen - Stammdaten
  (Vorname/Nachname/aktiv/Personalnummer), Rollen (Checkboxen, jede Aenderung
  sofort per POST/DELETE /benutzer/:id/rollen), Passwort/PIN setzen
- Neuer Screen `routes/zeiterfassung/ZeiterfassungUebersicht.tsx`:
  Statuskarte mit Arbeitszeit/Pausenzeit heute (GET /zeitbuchung/heute),
  Stempel-Buttons kontextabhaengig nach aktuellem Status (nur die laut
  Zustandsautomat erlaubten Aktionen werden angezeigt - z.B. nur "Kommen" im
  Status "ausgestempelt")
- `lib/api.ts`: `patch`/`delete`-Methoden ergaenzt (bisher nur `get`/`post`)
- `lib/types.ts`: Typen Benutzer/Rolle/Berechtigung/Zeitbuchung/ArbeitszeitHeute
  ergaenzt
- `nginx.conf` + `vite.config.ts` (Dev-Proxy): Routing fuer `/api/benutzer*`
  und `/api/rollen*` zum auth-service ergaenzt. Dabei eine Falle vermieden:
  die Locations sind bewusst OHNE abschliessenden Slash definiert (anders als
  `/api/auth/`), weil `GET/POST /benutzer` und `GET /rollen` ohne weiteren
  Pfad-Teil aufgerufen werden - eine Location "/api/benutzer/" mit Slash haette
  die exakte Anfrage "/api/benutzer" nicht erfasst und sie faelschlich an
  erp-service durchgereicht
- Verifiziert lokal: `npx tsc --noEmit` + `npm run build` erfolgreich, Bundle
  336 KB / 105 KB gzip
- Kiosk-Frontend (Wandtablet-UI) bewusst NICHT Teil dieser Aenderung - eigene,
  unabhaengige Oberflaeche fuer ein anderes Geraet/andere Zielgruppe, noch
  offen (siehe module-uebersicht.md)

### Auth: Benutzerverwaltung live verifiziert (07.08.2026)
- Auf dem Server end-to-end getestet: Benutzer angelegt (POST /benutzer -
  Response bestaetigt, dass kein passwortHash/pinHash mehr mitgeschickt wird),
  Rollenliste abgerufen (GET /rollen), Rolle 'sachbearbeiter' zugewiesen (POST
  /benutzer/:id/rollen - Response enthaelt alle 14 Berechtigungen dieser Rolle
  korrekt), PIN gesetzt (POST /benutzer/:id/pin), Rolle wieder entzogen
  (DELETE /benutzer/:id/rollen/:rolleId - rollen-Array danach korrekt leer)
- Damit ist Benutzerverwaltung (Fundament-Modul, Phase 0) vollstaendig
  implementiert und live verifiziert

### Auth: echte Benutzerverwaltung (07.08.2026)
- BenutzerModule + RollenModule (bisher leere Stubs) implementiert - loest den
  in auth.service.ts bootstrap()-Kommentar und den kiosk.controller.ts-TODO
  dokumentierten Zustand ab ("noch nicht implementiert" / manuelle DB-Updates)
- Neue Endpoints: `POST/GET /benutzer`, `GET /benutzer/:id`, `PATCH
  /benutzer/:id` (Vorname/Nachname/aktiv/Personalnummer/RFID-UID), `POST
  /benutzer/:id/passwort`, `POST /benutzer/:id/pin`, `POST DELETE
  /benutzer/:id/rollen(/:rolleId)`, `GET /rollen`, `GET /rollen/:id`
- Migration 0003: RBAC-Seed fuer modul_key 'benutzerverwaltung' (lesen/
  schreiben/administrieren), bewusst OHNE Verknuepfung zu den drei
  Nicht-Admin-Standardrollen - exklusiv Owner/Administrator, die den RbacGuard
  ohnehin per Rollen-Bypass passieren
- Kiosk-Geraete-Verwaltung (`/auth/kiosk/geraete`) von der provisorischen
  Bindung an `zeiterfassung:administrieren` auf `benutzerverwaltung:
  administrieren` umgestellt (war im Code als TODO vermerkt, seit es ein
  echtes Benutzerverwaltungs-Modul gibt)
- Bug waehrend Implementierung gefunden + behoben, VOR jedem Server-Deploy:
  `liste()`/`finden()` haetten ohne Gegenmassnahme `passwortHash`/`pinHash`
  (Argon2-Hashes) im JSON zurueckgegeben - kein globaler
  ClassSerializerInterceptor im Projekt. Fix: alle oeffentlichen
  Rueckgabewerte laufen durch eine private `oeffentlich()`-Methode, die beide
  Felder entfernt; interne Methoden, die den Hash selbst brauchen, bleiben
  getrennt
- Lokal build-verifiziert (`tsc --noEmit` + `nest build`), noch NICHT auf dem
  Server getestet - Migration 0003 steht dort noch aus

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
