# WälderBytes ERP V2 — Projektstand-Übergabe

Diese Zusammenfassung ist für einen neuen Claude-Chat gedacht (Geräte-/Session-Wechsel). Einfach komplett in den neuen Chat einfügen.

## Projekt

Multi-Tenant-ERP-System "WälderBytes ERP V2", von Grund auf neu gebaut (nicht die alte "waelderbytes-suite" v1). Ziel: vollumfängliches ERP mit Auftrags-/Projektverwaltung und Zeiterfassung, als Webapp, self-hosted oder als Abo buchbar, modular erweiterbar, DSGVO-konform.

**Repo:** `https://github.com/waelderbytes/erp-v2.git` (aktueller Stand HEAD: Commit `8df7afa`)
**Server:** Hetzner CPX22, `test.wbyt.app`, Deploy via Docker Compose + Traefik
**PAT/Zugangsdaten:** liegen in der Cowork-Outputs-Datei `zugangsdaten-NICHT-COMMITTEN.md` — NIE ins Repo committen (Regeln.md Abschnitt 0a)

## Architektur

- Backend: NestJS/TypeScript, aufgeteilt in eigenständig deploybare Services: `auth-service`, `erp-service`, `zeiterfassung-service`, `api-gateway` (noch leerer Stub)
- Frontend: React 18 + Vite PWA, `apps/web`, React Router 6, shadcn/ui (handgeschrieben) + Tailwind
- 1 physische Postgres-DB pro Tenant, gemeinsam genutzt von allen Services, aber **getrennte Migrations-Historien** je Service (`migrationsTableName`: `migrations`, `migrations_erp_service`, `migrations_zeiterfassung_service`)
- RBAC: Owner/Administrator umgehen alle Berechtigungsprüfungen (`RbacGuard`); andere Rollen brauchen explizite `modulKey:aktion`-Einträge im JWT

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

## Offene Baustelle gerade eben

Roadmap-Punkte 1-3 (Log-Tab, Bestand-Tab-immer-sichtbar, PWA) plus der vorgezogene `bomfaehig`-Fix sind alle CODE-fertig, lokal verifiziert und gepusht (Commits `3fc7d1f`, `5004a24`, `adfafe4`, `2bff571`) - **aber noch NICHT vom User auf dem Server deployt/bestätigt**. Deploy-Befehl (MIT Migrations-Schritt, da `bomfaehig` eine Schema-Aenderung ist):

```bash
cd /opt/erp-v2
git pull
docker compose build erp-service web
docker compose up -d erp-service web
docker compose exec erp-service npm run migration:run:prod
```

Naechster Roadmap-Schritt danach: Stückliste (BOM, Punkt 4) - das ist eine groessere Datenmodell-Entscheidung (mehrstufige Struktur, v1 hat das nie fertig gebaut), sollte NICHT einfach durchimplementiert werden, sondern der Ansatz erst mit dem User abgestimmt werden (siehe Nutzerpräferenz: keine Annahmen treffen).

Offener Nebenpunkt (nicht code-, sondern server-seitig): `docker compose`-Warnung "Found orphan containers (erp-v2-traefik-1)" auf dem Server. Traefik läuft laut Architektur-Entscheidung bewusst in einem separaten `infra-compose.yml`, nicht in diesem `docker-compose.yml` - die Warnung kommt vermutlich, weil beide Compose-Files ohne `-p` im selben Verzeichnis (`/opt/erp-v2`) laufen und dadurch denselben Projektnamen "erp-v2" erhalten. **NICHT** `--remove-orphans` verwenden, ohne vorher zu bestätigen, dass der Traefik-Container wirklich der aktive Reverse-Proxy ist (sonst Gefahr, die HTTPS-Terminierung fuer die ganze Seite zu killen). Sauberer Fix (spaeter, im Wartungsfenster): Infra-Stack mit eigenem Projektnamen starten (`docker compose -p infra -f infra-compose.yml up -d`). Noch ungeklaert, ob `test.wbyt.app` gerade normal ueber HTTPS erreichbar ist (User-Bestaetigung steht aus).

## Drei kürzlich behobene Produktionsvorfälle (zur Erinnerung an häufige Fehlerklasse)

1. **502 Bad Gateway**: `ArtikelUebersetzung`-Repository war im globalen TypeORM registriert und in `ArtikelService` injiziert, aber NICHT in `ArtikelModule`s eigenem `TypeOrmModule.forFeature([...])` — das ist ein DI-Wiring-Fehler, der bei `tsc --noEmit`/`nest build` NICHT auffällt, sondern erst beim echten App-Start. Das ist bereits mehrfach im Projekt passiert (auch bei `LagerModule` früher). **Merke: nach jeder neuen Entity/Repository immer prüfen, ob jedes Modul, das sie injiziert, sie auch in seinem eigenen `forFeature()` hat.**
2. **Internal Server Error** ("column Artikel.interne_notiz does not exist"): Migration war im Image, aber nicht auf der Produktions-DB ausgeführt worden. Merke: nach jedem Feature-Deploy mit Schema-Änderung explizit `docker compose exec erp-service npm run migration:run:prod` in der Deploy-Anleitung hervorheben.
3. **"Entity metadata for Artikel#einheit was not found"** beim Migrationslauf (08.08.2026, Einheiten-Modul): `src/database/data-source.ts` (eigene DataSource NUR für den Migrations-CLI-Lauf, komplett getrennt von `app.module.ts`s `TypeOrmModule.forRootAsync`-Entities-Liste) hatte die neue `Einheit`-Entity nicht in seiner `entities`-Liste, obwohl `Artikel` per `@ManyToOne` darauf verweist. **Dritte Stelle zur bisherigen DI-Wiring-Merkregel: bei jeder neuen Entity mit Relation IMMER drei Stellen prüfen — (a) jedes injizierende Modul's `forFeature()`, (b) `app.module.ts`s globale `entities`-Liste, (c) `database/data-source.ts`s `entities`-Liste (Migrations-DataSource).** `tsc --noEmit`/`nest build` schlagen bei sowas NICHT an, der Fehler zeigt sich erst beim echten Migrationslauf auf dem Server.

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

## Nächste offene Aufgaben (Roadmap, nach aktueller Priorität, Stand 08.08.2026)

1. ~~Artikel: Log-Tab~~ — erledigt (Commits `3fc7d1f`/`5004a24`), Deploy steht aus
2. ~~Artikel: Bestand-Tab immer sichtbar~~ — erledigt (Commit `5004a24`), Deploy steht aus
3. ~~PWA-Installierbarkeit~~ — erledigt (Commit `adfafe4`), Deploy steht aus
4. ~~`bomfaehig`-Flag nachgezogen~~ — erledigt (Commit `2bff571`), Deploy steht aus
5. **Stückliste (BOM)** — naechster Schritt, aber Datenmodell/Ansatz MUSS erst mit dem User abgestimmt werden, bevor Code geschrieben wird: User will die volle mehrstufige Variante (nicht die von mir empfohlene einfachere). ERP v1 hat die "Strukturstückliste" (druckbare mehrstufige Ansicht) selbst NIE fertig gebaut (nur Platzhalter-Screen) — kann also nicht 1:1 aus v1 übernommen werden, muss neu entworfen werden. Das flache v1-`stueckliste`-Datenmodell kann als Ausgangspunkt dienen (Recherche in v1 vor Design-Entscheidung: `services/erp-service` nach "stueckliste" durchsuchen). Voraussetzung `bomfaehig` ist jetzt erfuellt.

## Beim Feldkatalog-Abgleich (07./08.08.2026) gefundene fehlende Artikel-Felder

Laut `docs/feldkatalog.md` vorgesehen, aber in der Entity/DTO noch nicht vorhanden:
- `steuersatz_id` (Pflicht laut Feldkatalog) — wartet auf Modul Stammdaten/System-Einstellungen (Steuersätze existieren als Konzept noch nicht)
- `gewicht_kg`, `laenge_mm`/`breite_mm`/`hoehe_mm` (Standard-Erweiterungsfelder, optional)
- `mindestbestand` (nur relevant wenn `bestandsgefuehrt = true`, bereits separat als offener Punkt bei Lagerverwaltung vermerkt)
- ~~`bomfaehig`~~ — erledigt (Migration 0011, siehe oben)

## Sandbox-Hinweis (nur relevant, falls wieder mit Bash/Sandbox gearbeitet wird)

Die Cowork-Bash-Sandbox verliert zwischendurch geklonte Repos (`/tmp/erp-v2`). Recovery: neu klonen mit PAT-URL, `git config user.email/user.name` setzen, `npm install --ignore-scripts` (wegen argon2-Nativbuild-Problem im Sandbox-Netzwerk) im Repo-Root vor jedem `tsc`/`nest build`.
