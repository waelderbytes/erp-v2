# WälderBytes ERP V2 — Projektstand-Übergabe

Diese Zusammenfassung ist für einen neuen Claude-Chat gedacht (Geräte-/Session-Wechsel). Einfach komplett in den neuen Chat einfügen.

## Projekt

Multi-Tenant-ERP-System "WälderBytes ERP V2", von Grund auf neu gebaut (nicht die alte "waelderbytes-suite" v1). Ziel: vollumfängliches ERP mit Auftrags-/Projektverwaltung und Zeiterfassung, als Webapp, self-hosted oder als Abo buchbar, modular erweiterbar, DSGVO-konform.

**Repo:** `https://github.com/waelderbytes/erp-v2.git` (aktueller Stand HEAD: Commit `55480c5`)
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

## Offene Baustelle gerade eben

**Bug "Sprache löschen fehlgeschlagen"**: Root Cause war fehlendes `@HttpCode(204)` auf dem DELETE-Endpoint für Artikel-Übersetzungen (NestJS gibt bei `@Delete()` sonst default 200 mit leerem Body zurück, Frontend-Client `lib/api.ts` erwartet aber nur bei 204 keinen JSON-Body → Crash beim Parsen). **Fix ist committed + gepusht** (Commit `55480c5`), aber **noch NICHT vom User auf dem Server deployt/bestätigt**. Deploy-Befehl (kein Migrations-Schritt nötig, reiner Code-Fix):

```bash
cd /opt/erp-v2
git pull
docker compose build erp-service
docker compose up -d erp-service
```

**Zweiter Bug GELOEST (Commit `07ec16a`, gepusht, noch nicht deployt)**: "Artikel neu → zeigt nur 'Lädt…'". Root Cause: Route `artikel/neu` in `App.tsx` hatte keinen `:id`-Parameter, `useParams().id` lieferte bei `/artikel/neu` daher `undefined` statt `"neu"` -> `istNeu` faelschlich `false` -> Render-Guard haengt dauerhaft im Ladezustand (kein Request/Fehler, deckt sich mit User-Beobachtung). Fix: redundante Route entfernt, `artikel/:id` matcht `/artikel/neu` ebenfalls. Lokal verifiziert (`tsc --noEmit`, `vite build`). Deploy-Befehl (kein Migrations-Schritt, reiner Frontend-Code-Fix):

```bash
cd /opt/erp-v2
git pull
docker compose build web
docker compose up -d web
```

(Deploy-Service-Name ggf. anpassen, falls das Frontend in docker-compose.yml anders heisst.)

## Zwei kürzlich behobene Produktionsvorfälle (zur Erinnerung an häufige Fehlerklasse)

1. **502 Bad Gateway**: `ArtikelUebersetzung`-Repository war im globalen TypeORM registriert und in `ArtikelService` injiziert, aber NICHT in `ArtikelModule`s eigenem `TypeOrmModule.forFeature([...])` — das ist ein DI-Wiring-Fehler, der bei `tsc --noEmit`/`nest build` NICHT auffällt, sondern erst beim echten App-Start. Das ist bereits mehrfach im Projekt passiert (auch bei `LagerModule` früher). **Merke: nach jeder neuen Entity/Repository immer prüfen, ob jedes Modul, das sie injiziert, sie auch in seinem eigenen `forFeature()` hat.**
2. **Internal Server Error** ("column Artikel.interne_notiz does not exist"): Migration war im Image, aber nicht auf der Produktions-DB ausgeführt worden. Merke: nach jedem Feature-Deploy mit Schema-Änderung explizit `docker compose exec erp-service npm run migration:run:prod` in der Deploy-Anleitung hervorheben.

## Wichtige technische Patterns/Konventionen

- **Mehrsprachigkeit (i18n)**, aus ERP v1 übernommen: Standardsprache "de" liegt direkt auf den Basis-Entity-Spalten (`bezeichnung`=Kurztext, `beschreibung`=Langtext). Zusätzliche Sprachen liegen in einer separaten `*_uebersetzung`-Tabelle (ein Datensatz pro `parent_id`+`sprache`, UNIQUE-Constraint). API: PUT-Upsert über `(parentId, sprache)` aus der URL, kein eigenes Übersetzungs-ID-Konzept im Frontend.
- **"Interne Notiz"**: separates, einsprachiges, rein internes Freitextfeld, erscheint nie auf Kundendokumenten.
- **Anlegen+Bearbeiten-Assistent-Pattern** (aus v1 `ArtikelWizard.tsx` übernommen): eine Route/Komponente für `/xyz/neu` und `/xyz/:id`; erster Tab (Stammdaten) muss gespeichert werden (POST), bevor weitere Tabs (die eine echte ID brauchen) nutzbar werden; nach erstem Speichern `navigate(id, {replace:true})`.
- **NestJS HTTP-Status-Fallen**: `@Post()` = 201 default, `@Get()/@Put()/@Patch()/@Delete()` = 200 default. `@Delete()` mit `void`-Rückgabe braucht explizites `@HttpCode(204)`, sonst crasht der Frontend-JSON-Parser bei leerem Body.
- **`@JoinColumn`** ist Pflicht bei `@ManyToOne`, wenn zusätzlich eine rohe FK-Spalte mit implizit gleichem Namen existiert.
- Postgres `unique_violation` (Code `23505`) wird im Service-Layer als `ConflictException` mit klarer deutscher Meldung abgefangen — durchgängiges Pattern im ganzen Projekt.

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

## Nächste offene Aufgaben (Roadmap, nach aktueller Priorität)

1. Deploy des `55480c5`-Fixes bestätigen lassen (Sprache löschen)
2. ~~"Artikel neu → Lädt…"-Bug aufklären~~ – erledigt (Commit `07ec16a`), Deploy auf dem Server steht noch aus
3. Artikel: Log-Tab (Audit-Trail + Lagerbuchungen mit Buchungsgrund, Filter "nur Buchungen") — Audit-Log-Tabelle existiert bereits generisch per DB-Trigger, aber noch kein Query-Endpoint dafür
4. Artikel: Bestand-Tab soll IMMER sichtbar sein, nur ausgegraut/deaktiviert wenn nicht bestandsgeführt (aktuell wird der Tab komplett ausgeblendet — das soll geändert werden)
5. PWA-Installierbarkeit mit generiertem Platzhalter-Icon (User hat sich explizit für Platzhalter statt eigenem Logo entschieden)
6. Stückliste (BOM): User will die volle mehrstufige Variante (nicht die von mir empfohlene einfachere). Wichtig: ERP v1 hat die "Strukturstückliste" (druckbare mehrstufige Ansicht) selbst NIE fertig gebaut (nur Platzhalter-Screen) — kann für diesen Teil also nicht 1:1 aus v1 übernommen werden, muss neu entworfen werden. Das flache v1-`stueckliste`-Datenmodell kann aber als Ausgangspunkt dienen.

## Sandbox-Hinweis (nur relevant, falls wieder mit Bash/Sandbox gearbeitet wird)

Die Cowork-Bash-Sandbox verliert zwischendurch geklonte Repos (`/tmp/erp-v2`). Recovery: neu klonen mit PAT-URL, `git config user.email/user.name` setzen, `npm install --ignore-scripts` (wegen argon2-Nativbuild-Problem im Sandbox-Netzwerk) im Repo-Root vor jedem `tsc`/`nest build`.
