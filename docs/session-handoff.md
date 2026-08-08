# WälderBytes ERP V2 — Projektstand-Übergabe

Diese Zusammenfassung ist für einen neuen Claude-Chat gedacht (Geräte-/Session-Wechsel). Einfach komplett in den neuen Chat einfügen.

## Projekt

Multi-Tenant-ERP-System "WälderBytes ERP V2", von Grund auf neu gebaut (nicht die alte "waelderbytes-suite" v1). Ziel: vollumfängliches ERP mit Auftrags-/Projektverwaltung und Zeiterfassung, als Webapp, self-hosted oder als Abo buchbar, modular erweiterbar, DSGVO-konform.

**Repo:** `https://github.com/waelderbytes/erp-v2.git` (aktueller Stand HEAD: Commit `19f38d8`, siehe unten fuer Details zu den einzelnen Commits dieser Session)
**Server:** Hetzner CPX22, `test.wbyt.app`, Deploy via Docker Compose + Traefik
**PAT/Zugangsdaten:** liegen in der Cowork-Outputs-Datei `zugangsdaten-NICHT-COMMITTEN.md` — NIE ins Repo committen (Regeln.md Abschnitt 0a)

## Architektur

- Backend: NestJS/TypeScript, aufgeteilt in eigenständig deploybare Services: `auth-service`, `erp-service`, `zeiterfassung-service`, `api-gateway` (noch leerer Stub)
- Frontend: React 18 + Vite PWA, `apps/web`, React Router 6, shadcn/ui (handgeschrieben) + Tailwind
- 1 physische Postgres-DB pro Tenant, gemeinsam genutzt von allen Services, aber **getrennte Migrations-Historien** je Service (`migrationsTableName`: `migrations`, `migrations_erp_service`, `migrations_zeiterfassung_service`)
- RBAC: Owner/Administrator umgehen alle Berechtigungsprüfungen (`RbacGuard`); andere Rollen brauchen explizite `modulKey:aktion`-Einträge im JWT

## Umgang mit ERP v1 (waelderbytes-suite) als Referenz — WICHTIGE Leitlinie

Nutzerentscheidung 08.08.2026, explizit und dauerhaft: v1 darf als Referenz für
**Datenfelder/Feldschema** herangezogen werden (z. B. welche Spalten braucht eine
Beleg-Tabelle), aber **NICHT für Abläufe/Prozesslogik**. Zitat: "wir sollten uns
nicht zu nah am v1 orientieren, es gibt gründe warum ich da abgebrochen habe und
ans v2 ging, wir können es für felder etc nutzen aber nicht für abläufe". Konkret
bei der Belegkette angewandt: Feldschema (Beleg/Beleg-Position) an v1 angelehnt,
aber die Umwandlungs-/Teillieferungslogik komplett neu entworfen, weil v1 dort
z. B. gar keine echte Teillieferung/-rechnung hatte (nur 1:1-Vollkopie beim
Umwandeln). Bei jedem künftigen Modul, das einen v1-Vorläufer hat: Feldschema
gerne übernehmen, Ablauf/Workflow eigenständig entwerfen und wenn ein v1-Ablauf
als Vorbild dienen könnte, das explizit mit dem Nutzer abstimmen statt anzunehmen.

## Fertige Module (live verifiziert)

1. Auth-Grundfunktionen, Artikelstamm, Kunden-/Lieferantenstamm, Lagerverwaltung, Einkauf/Bestellwesen, Preisfindung (Phase 1, Backend)
2. Frontend-Grundgerüst + UI-Screens Warenwirtschaft
3. UI-Politur Artikel (Fokus)
4. Zeiterfassung: Personalnummer/PIN + Kiosk-Identify, eigener `zeiterfassung-service` (Kommt/Geht/Pause) — end-to-end getestet
5. Echte Benutzerverwaltung im `auth-service` (Argon2-Hashes werden nie in API-Responses zurückgegeben — bewusst geprüft)
6. Frontend-UI Benutzerverwaltung + Zeiterfassung
7. Backend: Mehrsprachigkeit (Kurztext/Langtext) + interne Notiz bei Artikel — Pattern 1:1 aus ERP v1 übernommen (siehe unten)
8. Frontend: Artikel Anlegen+Bearbeiten zu einem mehrstufigen Assistenten verschmolzen (`/artikel/neu` und `/artikel/:id` nutzen dieselbe Komponente)
9. Bugfix "Artikel neu → Lädt…" (fehlender `:id`-Param auf Route) — deployt + bestätigt
10. Artikel-Wizard-UX: alle Tabs von Anfang an sichtbar (disabled bis Stammdaten gespeichert) + Weiter/Zurück-Fuehrung mit Auto-Sprung nach dem Speichern (überspringt deaktivierte Tabs) — deployt
11. Echtes Einheiten-Modul (`GET/POST/DELETE /einheiten`, `artikel.einheit_id` als FK statt Freitext) + generisches `SearchCreateDropdown` (tippen filtert, "+ anlegen") + Kurztext-Vorschlaege aus vorhandenen Artikeln — deployt + Migrationslauf bestätigt erfolgreich (08.08.2026, nach Fix für fehlende Einheit-Entity in `data-source.ts`, siehe Vorfall 3 unten)
12. Artikel Log-Tab (`GET /artikel/:id/log`, kombiniert Audit-Trail + Lagerbuchungen) + Bestand-Tab jetzt immer sichtbar (nur ausgegraut wenn nicht bestandsgeführt) — gepusht (Commits `3fc7d1f`/`5004a24`), **Deploy/Migration auf dem Server noch nicht bestätigt**
13. PWA-Installierbarkeit (`vite-plugin-pwa` aktiviert, generierte Platzhalter-Icons) — gepusht (Commit `adfafe4`), **Deploy auf dem Server noch nicht bestätigt**
14. `artikel.bomfaehig`-Flag nachgezogen (Migration 0011, Vorbereitung Stückliste/BOM) — gepusht (Commit `2bff571`), **Deploy/Migration auf dem Server noch nicht bestätigt**
15. Stückliste (BOM), mehrstufig: `stueckliste_position` (selbstreferenzierend über artikel), Zirkelbezug-Schutz per BFS, Tab "Stückliste" mit Baumansicht + druckbarer komplett aufgelöster Strukturstückliste — gepusht (Commits `5cf5383`/`83bb523`/`a094e5a`), **NOCH NICHT deployt, Migration 0012 lokal nicht gegen echte DB testbar (Sandbox ohne Postgres) — auf dem Testserver besonders sorgfältig prüfen (Zirkelbezug-Fehlermeldung testen, mehrstufig anlegen)**
16. Log-Tab loest Benutzer-UUID zu Namen auf (laedt zusaetzlich `GET /benutzer`, faellt bei 403 auf rohe UUID zurueck) — gepusht (Commit `c6ac11c`), **Deploy steht aus**
17. Letzte Feldkatalog-Luecken bei Artikel: `gewicht_kg`, `laenge_mm`/`breite_mm`/`hoehe_mm`, `mindestbestand` (Migration 0013) — gepusht (Commits `98031b1`/`999094e`), **Deploy/Migration steht aus**. Damit war der Feldkatalog-Abgleich bis auf `steuersatz_id` komplett
18. **Modul Stammdaten/System-Einstellungen** (Backend+Frontend, 08.08.2026): Nutzerentscheidung erstmal 1 Firma (kein Mehrfirmen-Umbau). Steuersaetze (Migration 0014, Seed 19/7/0%), `artikel.steuersatz_id` jetzt echte Pflicht-FK (Migration 0015 — **damit ist der Feldkatalog-Abgleich jetzt wirklich vollstaendig abgearbeitet**), Firmenstammdaten (Migration 0016: Name/Anschrift/USt-IdNr./Steuernummer/Telefon/E-Mail/Kleinunternehmer-Flag). Neue Endpoints unter modul_key `stammdaten` (`GET/PATCH /firma`, `POST /firma/artikelnummern-schema`, `PATCH /firma/artikelnummern-stellen`, `GET/POST/PATCH /steuersaetze`, `GET/PATCH /nummernkreise/:entityKey`). Frontend: Seite `/stammdaten` (Tabs Firma/Steuersaetze/Nummernkreise), Steuersatz-Pflichtfeld im Artikel-Stammdaten-Tab — gepusht (Commits `1209dd3` Backend, `657b161` Frontend, `d0829eb` Docs), **NOCH NICHT deployt, Migrationen 0014-0016 lokal nicht gegen echte DB testbar**
19. **Reset-/Seed-Skripte fuer Testdaten** (08.08.2026): `scripts/reset-testdaten.sql` (leert nur Bewegungsdaten, Stammdaten/Konfiguration bleibt, `nummernkreis.next_value` wird zurueckgesetzt, `audit_log` nur scoped bereinigt statt pauschal geleert — siehe architecture.md Abschnitt 5, Unveraenderlichkeit) + `apps/erp-service/src/database/seed-testdaten.ts` (`npm run seed:testdaten`, legt Testdaten ueber die echten Services an, jederzeit wiederholt ausfuehrbar) — gepusht (Commit `a724a5d`), **bestaetigt funktionsfaehig auf dem Server** (Nutzer 08.08.2026: "okay geht auch")
20. **Design-Update** (08.08.2026): grafische Annaeherung an vom Nutzer bereitgestellte Referenzbilder ("Nexus ERP") — bewusst NUR Layout/Struktur, KEINE Farbaenderung (bestehendes Farbschema/CSS-Variablen bleiben). Card-Top-Akzent + CardTitle als Uppercase-Eyebrow (wirkt global), Tabs unterstrichen statt Pill-Optik, neue `PageHeading`-Komponente (Eyebrow=Navigationsgruppe + fetter Titel) auf allen Listen-/Uebersichtsseiten, TableHead uppercase/tracking-wide, Sidebar-Markenblock + Benutzerblock (E-Mail+Rolle) + linker Farbakzent bei aktivem Navigationspunkt. Erste Version deckte nur Card/Tabs-lastige Seiten ab (Stammdaten, Artikel-Detail) — nach Nutzer-Feedback ("warum nicht das menu links warum nicht alles") in einer zweiten Runde auf ALLE Seiten ausgeweitet — gepusht (Commits `1f6ab65`, `f3511fd`), **bestaetigt sichtbar auf dem Server**
21. **Modul Belegkette (Verkauf)**: Angebot → Auftragsbestaetigung → Lieferschein → Rechnung (08.08.2026). Siehe eigene Sektion "Umgang mit ERP v1 als Referenz" oben fuer die Leitentscheidung dazu (Feldschema an v1 angelehnt, Ablauf/Teillieferungslogik komplett neu). Gemeinsames `beleg`+`beleg_position`-Datenmodell (Migration 0017), vier neue Nummernkreise, echte Teillieferung/-rechnung per Position (`weitergefuehrte_menge`, analog `bestellposition.gelieferte_menge`), automatischer Status offen/teilweise_weitergefuehrt/abgeschlossen/storniert, Preis-/Steuersatz-Snapshot pro Position (GoBD), Preisfindung wird beim Anlegen automatisch herangezogen, Lieferschein-Anlage bucht automatisch Warenausgang, `festgeschrieben`-Flag fuer Rechnungen (GoBD-Unveraenderlichkeit, noch ohne PDF-Kopplung). Neuer RBAC-modul_key `verkauf`. Frontend: neue Nav-Gruppe "Vertrieb", generische Listen-/Detail-Komponenten fuer alle vier Typen inkl. Uebernehmen-Dialog mit Teilmengen-Auswahl und Kleinunternehmer-bewusster Summenanzeige — gepusht (Commits `772203f` Backend, `e3afff2` Frontend, `19f38d8` Docs), **NOCH NICHT deployt, Migration 0017 lokal nicht gegen echte DB testbar**. Bewusst NICHT Teil dieser ersten Version: PDF-Ausgabe (Nutzerentscheidung: erst Workflow, PDF als Folgeschritt)

## Offene Baustelle gerade eben

Stand: Stammdaten-Modul (Migrationen 0014-0016), Reset-/Seed-Skripte UND das
Design-Update sind vom Nutzer bereits auf dem Server bestaetigt ("okay dann
machen wir weiter" nach erfolgreichem Test aller drei). **Neu und NOCH NICHT
deployt: Modul Belegkette (Migration 0017, Commits `772203f`/`e3afff2`).**
Deploy-Befehl fuer den aktuellen Stand:

```bash
cd /opt/erp-v2
git pull
docker compose build erp-service web
docker compose up -d erp-service web
docker compose exec erp-service npm run migration:run:prod
```

Das fuehrt (idempotent) alle noch nicht gelaufenen Migrationen aus, aktuell vor
allem Migration 0017 (`beleg`/`beleg_position`, vier neue Nummernkreise).
**Wichtig**: Migration 0017 konnte lokal NICHT gegen eine echte Postgres-DB
getestet werden (Cowork-Sandbox hat keinen Docker/Postgres-Zugriff). Nach dem
Deploy auf dem Testserver gezielt pruefen:
- Neue Nav-Gruppe "Vertrieb" sichtbar (Angebote/Auftraege/Lieferscheine/Rechnungen)
- Ein Angebot mit 2-3 Positionen anlegen (einmal mit Artikel-Auswahl, einmal
  Freitext-Position ohne Artikel), Preis/Steuersatz automatisch ermittelt pruefen
- Angebot -> Auftragsbestaetigung uebernehmen, dabei bewusst nur eine TEIL-Menge
  einer Position auswaehlen -> Status muss "Teilweise weitergeführt" werden,
  Restmenge muss beim zweiten Uebernehmen-Versuch korrekt kleiner sein
- Auftragsbestaetigung -> Lieferschein uebernehmen (Lager auswaehlen) -> pruefen,
  dass tatsaechlich ein Warenausgang gebucht wurde (Lagerbestand-Abfrage oder
  Artikel-Log-Tab) und NUR fuer bestandsgefuehrte Artikel
- Lieferschein -> Rechnung uebernehmen, Rechnung "Festschreiben", danach pruefen
  dass Stornieren abgelehnt wird (GoBD-Unveraenderlichkeit)
- Bei einer Firma mit `kleinunternehmer=true` pruefen, dass die Summenanzeige
  KEINE Umsatzsteuer ausweist und stattdessen der Pflichthinweistext erscheint

Alle groesseren Entscheidungen dieser Session (Stückliste-Datenmodell,
Log-Benutzer-Fix-Umfang, Stammdaten erstmal 1 Firma, Reset-Umfang nur
Bewegungsdaten, Seed ueber echte Services, Belegkette-Datenmodell/
Teillieferung/PDF-Umfang, v1 nur fuer Felder nicht fuer Ablaeufe) wurden VOR der
Umsetzung per Rueckfrage mit dem User abgestimmt, nicht geraten.

Naechster Schritt nach bestätigtem Deploy: PDF-Ausgabe fuer die Belegkette
(bewusst zurueckgestellter Folgeschritt), oder eine neue Prioritaet mit dem User
klaeren (z. B. Materialbedarfsplanung/Fertigungsauftraege, Projekt-/
Auftragsverwaltung, RBAC-Rollenzuteilung fuer `stammdaten`/`verkauf`).

Offener Nebenpunkt (nicht code-, sondern server-seitig, seit laengerem
unveraendert): `docker compose`-Warnung "Found orphan containers
(erp-v2-traefik-1)" auf dem Server. Traefik läuft laut Architektur-Entscheidung
bewusst in einem separaten `infra-compose.yml`, nicht in diesem
`docker-compose.yml` - die Warnung kommt vermutlich, weil beide Compose-Files
ohne `-p` im selben Verzeichnis (`/opt/erp-v2`) laufen und dadurch denselben
Projektnamen "erp-v2" erhalten. **NICHT** `--remove-orphans` verwenden, ohne
vorher zu bestätigen, dass der Traefik-Container wirklich der aktive
Reverse-Proxy ist (sonst Gefahr, die HTTPS-Terminierung fuer die ganze Seite zu
killen). Sauberer Fix (spaeter, im Wartungsfenster): Infra-Stack mit eigenem
Projektnamen starten (`docker compose -p infra -f infra-compose.yml up -d`).

## Drei kürzlich behobene Produktionsvorfälle (zur Erinnerung an häufige Fehlerklasse)

1. **502 Bad Gateway**: `ArtikelUebersetzung`-Repository war im globalen TypeORM registriert und in `ArtikelService` injiziert, aber NICHT in `ArtikelModule`s eigenem `TypeOrmModule.forFeature([...])` — das ist ein DI-Wiring-Fehler, der bei `tsc --noEmit`/`nest build` NICHT auffällt, sondern erst beim echten App-Start. Das ist bereits mehrfach im Projekt passiert (auch bei `LagerModule` früher). **Merke: nach jeder neuen Entity/Repository immer prüfen, ob jedes Modul, das sie injiziert, sie auch in seinem eigenen `forFeature()` hat.**
2. **Internal Server Error** ("column Artikel.interne_notiz does not exist"): Migration war im Image, aber nicht auf der Produktions-DB ausgeführt worden. Merke: nach jedem Feature-Deploy mit Schema-Änderung explizit `docker compose exec erp-service npm run migration:run:prod` in der Deploy-Anleitung hervorheben.
3. **"Entity metadata for Artikel#einheit was not found"** beim Migrationslauf (08.08.2026, Einheiten-Modul): `src/database/data-source.ts` (eigene DataSource NUR für den Migrations-CLI-Lauf, komplett getrennt von `app.module.ts`s `TypeOrmModule.forRootAsync`-Entities-Liste) hatte die neue `Einheit`-Entity nicht in seiner `entities`-Liste, obwohl `Artikel` per `@ManyToOne` darauf verweist. **Dritte Stelle zur bisherigen DI-Wiring-Merkregel: bei jeder neuen Entity mit Relation IMMER drei Stellen prüfen — (a) jedes injizierende Modul's `forFeature()`, (b) `app.module.ts`s globale `entities`-Liste, (c) `database/data-source.ts`s `entities`-Liste (Migrations-DataSource).** `tsc --noEmit`/`nest build` schlagen bei sowas NICHT an, der Fehler zeigt sich erst beim echten Migrationslauf auf dem Server.

## Bekannte, noch nicht behobene Lücke: audit_log.changed_by immer NULL

Nutzer-Report (08.08.2026): im Log-Tab steht bei Audit-Eintraegen (Aenderungen,
nicht Lagerbuchungen) immer "-" statt eines Benutzers. **Kein Anzeigefehler**:
`audit_log.changed_by` ist seit der allerersten auth-service-Migration
(0001_initial_schema.ts) fuer JEDE Tabelle mit Audit-Trigger IMMER NULL, weil
kein einziger Service jemals die Postgres-Session-Variable
`app.current_user_id` setzt, die der Trigger via `current_setting(...)`
ausliest (siehe `audit_trigger_fn` dort). `SET LOCAL` wirkt nur innerhalb
einer Transaktion - die aktuellen Schreibzugriffe laufen aber als einzelne,
implizite Mini-Transaktionen ohne gemeinsame, request-weite Connection. Ein
korrekter Fix braucht eine Request-weite Transaktion (jeder authentifizierte
Request bekommt eine eigene DB-Connection/EntityManager, alle
Repository-Zugriffe waehrend des Requests laufen darueber) - das betrifft
praktisch jeden Schreibpfad im gesamten Backend (alle drei Services), nicht
nur Artikel. Nutzerentscheidung nach Rueckfrage (08.08.2026): NICHT jetzt
angehen, nur dokumentieren. Bei Bedarf spaeter als eigenes, bewusst
priorisiertes Vorhaben angehen, nicht nebenbei.

## Wichtige technische Patterns/Konventionen

- **Mehrsprachigkeit (i18n)**, aus ERP v1 übernommen: Standardsprache "de" liegt direkt auf den Basis-Entity-Spalten (`bezeichnung`=Kurztext, `beschreibung`=Langtext). Zusätzliche Sprachen liegen in einer separaten `*_uebersetzung`-Tabelle (ein Datensatz pro `parent_id`+`sprache`, UNIQUE-Constraint). API: PUT-Upsert über `(parentId, sprache)` aus der URL, kein eigenes Übersetzungs-ID-Konzept im Frontend.
- **"Interne Notiz"**: separates, einsprachiges, rein internes Freitextfeld, erscheint nie auf Kundendokumenten.
- **Anlegen+Bearbeiten-Assistent-Pattern** (aus v1 `ArtikelWizard.tsx` übernommen): eine Route/Komponente für `/xyz/neu` und `/xyz/:id`; erster Tab (Stammdaten) muss gespeichert werden (POST), bevor weitere Tabs (die eine echte ID brauchen) nutzbar werden; nach erstem Speichern `navigate(id, {replace:true})`.
- **NestJS HTTP-Status-Fallen**: `@Post()` = 201 default, `@Get()/@Put()/@Patch()/@Delete()` = 200 default. `@Delete()` mit `void`-Rückgabe braucht explizites `@HttpCode(204)`, sonst crasht der Frontend-JSON-Parser bei leerem Body.
- **`@JoinColumn`** ist Pflicht bei `@ManyToOne`, wenn zusätzlich eine rohe FK-Spalte mit implizit gleichem Namen existiert.
- Postgres `unique_violation` (Code `23505`) wird im Service-Layer als `ConflictException` mit klarer deutscher Meldung abgefangen — durchgängiges Pattern im ganzen Projekt.
- **Dropdowns generell** (Nutzerwunsch 08.08.2026, "das können wir für alle dropdowns natürlich anwenden"): `apps/web/src/components/ui/search-create-dropdown.tsx` (`SearchCreateDropdown`, 1:1 aus ERP v1 `components/desktop/SearchCreateDropdown.tsx` übernommen) ist der Standard für neue Auswahl-Dropdowns mit Tipp-Filter + optionalem Inline-Anlegen (`onCreateRequest`) + Deaktivieren (`onDeactivate`) — bisher nur bei Artikel→Einheit im Einsatz, aber bewusst domainfrei für Warengruppen/Kunde/Lieferant-Auswahl etc. bei Bedarf.

## Standing Rules (IMMER einhalten)

- Vor jedem "git pull an den User" IMMER lokal fertig bauen/verifizieren (`npm install`, `tsc --noEmit` + `nest build` je Service, bzw. `vite build` fürs Frontend)
- Nach jedem Push: exakten `git pull`-Befehl UND exakte Docker-Befehle geben, in ```bash-Codeblöcken (nicht bare ```-Blöcke)
- Bei Schema-Änderungen: Migrations-Schritt im Deploy immer explizit erwähnen
- PAT niemals ins Repo committen — nur in `zugangsdaten-NICHT-COMMITTEN.md`
- `docs/module-uebersicht.md` und `docs/CHANGELOG.md` nach jedem verifizierten Meilenstein aktualisieren — sowohl im Repo (`docs/`) als auch in der Cowork-Outputs-Spiegelkopie
- Task-Tool (TaskCreate/TaskUpdate) nutzen, um Modul-Lebenszyklus zu tracken

## Nutzerpräferenzen (Martin)

- Kurze, direkte, ungeschönte Antworten, keine unnötige Verbosität
- Keine Fakten erfinden — bei Unklarheit IMMER nachfragen statt zu raten (galt z.B. bei der v1-Recherche zur Mehrsprachigkeit — dort wurde explizit um Repo-Zugriff gebeten statt zu raten)
- Deutsch im Projekt-Kontext
- Code möglichst genau auf Deutsch kommentieren

## Nächste offene Aufgaben (Roadmap, Stand 08.08.2026)

Alle bisherigen Roadmap-Punkte sind CODE-fertig (siehe "Offene Baustelle" oben fuer Deploy-Status):

1. ~~Artikel: Log-Tab~~ — erledigt (Commits `3fc7d1f`/`5004a24`), Deploy steht aus
2. ~~Artikel: Bestand-Tab immer sichtbar~~ — erledigt (Commit `5004a24`), Deploy steht aus
3. ~~PWA-Installierbarkeit~~ — erledigt (Commit `adfafe4`), Deploy steht aus
4. ~~`bomfaehig`-Flag nachgezogen~~ — erledigt (Commit `2bff571`), Deploy steht aus
5. ~~Stückliste (BOM), mehrstufig~~ — erledigt (Commits `5cf5383`/`83bb523`), Deploy steht aus. Entschieden VOR der Umsetzung (nicht geraten): feste Menge (kein Verschnitt-Feld), nur echte Artikel-Positionen (keine Textzeilen), Baumansicht + druckbare Strukturstückliste von Anfang an. ERP v1 hat die "Strukturstückliste" selbst nie fertig gebaut - Datenmodell hier komplett neu entworfen.
6. ~~Log-Tab: Benutzer-UUID zu Namen aufloesen~~ — erledigt (Commit `c6ac11c`), Deploy steht aus. Bekannte, bewusst zurueckgestellte Luecke dabei entdeckt: `audit_log.changed_by` ist immer NULL (eigene Sektion oben)
7. ~~Letzte Feldkatalog-Luecken (gewicht_kg, Masse, mindestbestand)~~ — erledigt (Commits `98031b1`/`999094e`), Deploy steht aus
8. ~~Modul Stammdaten/System-Einstellungen (Firma/Steuersaetze/Nummernkreis-UI/Artikelnummern-Schema-UI)~~ — erledigt (Commits `1209dd3`/`657b161`/`d0829eb`), **auf dem Server bestaetigt**. Entschieden VOR der Umsetzung: erstmal 1 Firma (Singleton bleibt, kein `firma_id`-Umbau)
9. ~~Reset-/Seed-Skripte fuer Testdaten~~ — erledigt (Commit `a724a5d`), **auf dem Server bestaetigt**. Entschieden VOR der Umsetzung: nur Bewegungsdaten zuruecksetzen, Seed ueber echte Services statt SQL-Insert
10. ~~Design-Update (Layout, keine Farbaenderung)~~ — erledigt (Commits `1f6ab65`/`f3511fd`), **auf dem Server bestaetigt** (zwei Runden: erst Card/Tabs, dann auf Nutzer-Wunsch alle Seiten)
11. ~~Modul Belegkette (Verkauf): Angebot/Auftragsbestaetigung/Lieferschein/Rechnung~~ — erledigt (Commits `772203f`/`e3afff2`/`19f38d8`), Deploy steht aus. Entschieden VOR der Umsetzung: gemeinsames Datenmodell (Feldschema aus v1), Ablauf/Teillieferung komplett neu entworfen (NICHT aus v1), erst Workflow dann PDF

**Offen als naechstes**: PDF-Ausgabe fuer die Belegkette (bewusst zurueckgestellter Folgeschritt der gerade fertigen Basis-Version) - sonst muss die naechste Prioritaet neu mit dem User geklaert werden (z.B. Materialbedarfsplanung/Fertigungsauftraege als natuerlicher Folgeschritt der Stückliste, Projekt-/Auftragsverwaltung, oder eigene RBAC-Rollenzuteilung fuer die neuen modul_keys `stammdaten`/`verkauf` ausserhalb Owner/Administrator - siehe module-uebersicht.md).

## Beim Feldkatalog-Abgleich (07./08.08.2026) gefundene fehlende Artikel-Felder

Laut `docs/feldkatalog.md` vorgesehen - **jetzt vollstaendig abgearbeitet**:
- ~~`steuersatz_id`~~ — erledigt (Migration 0015, echte Pflicht-FK auf neue `steuersatz`-Tabelle, Migration 0014). War der letzte offene Punkt, wartete auf das Modul Stammdaten/System-Einstellungen (08.08.2026 umgesetzt)
- ~~`gewicht_kg`, `laenge_mm`/`breite_mm`/`hoehe_mm`~~ — erledigt (Migration 0013)
- ~~`mindestbestand`~~ — erledigt (Migration 0013)
- ~~`bomfaehig`~~ — erledigt (Migration 0011)

## Sandbox-Hinweis (nur relevant, falls wieder mit Bash/Sandbox gearbeitet wird)

Die Cowork-Bash-Sandbox verliert zwischendurch geklonte Repos (`/tmp/erp-v2`). Recovery: neu klonen mit PAT-URL, `git config user.email/user.name` setzen, `npm install --ignore-scripts` (wegen argon2-Nativbuild-Problem im Sandbox-Netzwerk) im Repo-Root vor jedem `tsc`/`nest build`.
