# Regeln.md – Arbeitsweise für Claude in diesem Projekt

Gilt für jede Coding-Session in diesem Repository, unabhängig davon, welches Modul
gerade bearbeitet wird oder in welchem Chat.

## 0. Wichtiger Hinweis zur Umgebung

- In Cowork (Sandbox mit Bash + Netzwerkzugriff) kann mit einem vom Nutzer
  bereitgestellten Personal Access Token real zu GitHub gepusht werden (siehe
  Abschnitt 1a) - anders als im reinen claude.ai-Web-/Mobile-Chat ohne Bash-Zugriff,
  wo das NICHT moeglich ist (dort nur lokal committen, Dateien manuell exportieren).
- Der vollstaendige Workflow inkl. Push funktioniert ausserdem in **Claude Code**
  (CLI/Desktop-App, mit dem echten lokalen Repo und echten git-Credentials
  verbunden). Dort gelten die folgenden Regeln vollstaendig.
- Diese Datei liegt zusaetzlich als `CLAUDE.md` im Repo-Root, damit Claude Code sie
  automatisch beim Start jeder Session laedt.

## 0a. GitHub-Zugangsdaten (Nutzerpräferenz, 08.08.2026 – bewusst akzeptiertes Risiko)

- Der Nutzer hat entschieden, dass der GitHub PAT NICHT in jeder Session neu abgefragt
  werden soll, obwohl ihm das Sicherheitsrisiko bewusst ist ("ich weiß es ist unsicher").
- Der Token wird **NICHT** in dieses Repo (weder hier noch in `CLAUDE.md` noch sonstwo
  versioniert) committet – GitHub Push Protection blockt Pushes mit erkennbaren PAT-
  Mustern ohnehin, und alles einmal Gepushte bleibt dauerhaft in der Git-History,
  auch nach nachträglichem Entfernen.
- Stattdessen liegt der aktuell gültige Token in einer Datei außerhalb des Repos, im
  persistenten Cowork-Outputs-Ordner: `zugangsdaten-NICHT-COMMITTEN.md`. Diese Datei
  wird nie `git add`et.
- Vor jedem Push in einer neuen Session zuerst dort nachsehen, statt den Nutzer erneut
  nach dem Token zu fragen. Falls der Token dort fehlt oder GitHub ihn als ungültig
  zurückweist (z. B. nach Rotation durch den Nutzer): erst dann nachfragen.
- Wird der Token vom Nutzer rotiert/erneuert, muss die Datei entsprechend aktualisiert
  werden.

## 1. Commit-Verhalten

- Änderungen in möglichst kleinen, in sich geschlossenen, logischen Einheiten
  committen – nicht "alles auf einmal am Ende".
- Nach Abschluss einer sinnvollen, in sich funktionsfähigen Einheit: **committen und
  pushen, ohne extra nachzufragen** – solange es sich um die Umsetzung bereits in
  `docs/architecture.md` bzw. `docs/module-uebersicht.md` abgestimmter Entscheidungen
  handelt.
- Bei neuen, bisher nicht abgestimmten Grundsatzentscheidungen (z. B. neues
  Datenmodell-Konzept, neue Abhängigkeit, Abweichung von der Architektur): zuerst
  nachfragen, nicht einfach umsetzen und committen (siehe Nutzerpräferenz: keine
  Annahmen treffen).
- Kein `git push --force` auf den Hauptbranch, außer explizit angewiesen.

## 1a. Verifizieren VOR jeder Übergabe an den Nutzer (Nutzerpräferenz, 07.08.2026)

Der Nutzer will nicht selbst debuggen müssen, was Claude ungetestet abgeliefert hat.
Deshalb gilt ab jetzt zwingend, nicht optional:

- Vor jedem "du kannst pullen"/"leg auf dem Server los": **Dependencies installieren
  und Build tatsächlich durchlaufen lassen** (`npm install`, `npm run build` je
  betroffenem Service/App), nicht nur Code hinschreiben und hoffen, dass er kompiliert.
- Falls Tests/Linter im Projekt existieren, müssen sie grün sein (siehe auch Abschnitt
  3 unten).
- Schlägt Build/Test fehl: erst reparieren, dann erneut verifizieren – NICHT
  kaputten Stand committen/pushen und das Debuggen dem Nutzer überlassen.
- Erst wenn lokal verifiziert: pushen, und dem Nutzer danach IMMER zwei konkrete,
  copy-paste-fertige Dinge nennen:
  1. den exakten `git pull`-Befehl (inkl. Zielverzeichnis auf dem Server, falls nicht
     offensichtlich)
  2. den/die exakten Docker-Befehl(e), um die Änderung produktiv zu übernehmen (z. B.
     `docker compose build <service> && docker compose up -d <service>`) – nicht nur
     "starte den Service neu" als vage Beschreibung.
- Diese Regel gilt für jede Übergabe, nicht nur für die ersten male – dauerhaft in die
  Arbeitsweise übernehmen, nicht nur für diesen einen Auth-Service-Commit.

## 2. Commit-Message-Format (Conventional Commits)

Format: `<typ>(<scope>): <kurze Beschreibung auf Deutsch>`

Typen:
- `feat` – neue fachliche Funktion
- `fix` – Bugfix
- `docs` – nur Dokumentation
- `refactor` – Code-Umbau ohne Verhaltensänderung
- `test` – Tests hinzugefügt/geändert
- `chore` – Wartungsarbeiten (Dependencies, Config)
- `perf` – Performance-Verbesserung
- `ci` / `build` – Build- oder Pipeline-Änderungen

Beispiele:
```
feat(artikelstamm): Nummernkreis-Engine für Hauptgruppen implementiert
fix(auth): Race Condition bei gleichzeitiger Tenant-Erstellung behoben
docs(compliance): Anwenderdokumentation für Zeiterfassung ergänzt
```

Der Scope (in Klammern) ist der Modulname (z. B. `auth`, `artikelstamm`, `lager`,
`zeiterfassung`). Diese Struktur ermöglicht später automatisch generierte Changelogs
aus der Commit-Historie.

## 3. Versionierung & Changelog

- Semantic Versioning: `MAJOR.MINOR.PATCH` (siehe `CHANGELOG.md`)
- Jede relevante Änderung bekommt einen Eintrag unter „Unreleased" in `CHANGELOG.md`,
  bis zum nächsten Release-Tag.

## 4. Was NICHT automatisch passiert

- Kein automatisches Deployment/Release ohne Rückfrage.
- Keine Änderungen an bereits als GoBD-relevant festgeschriebenen Daten oder an
  bestehenden DB-Migrationen ohne Rückfrage (Migrations werden ergänzt, nicht
  nachträglich verändert – siehe architecture.md, GoBD-Unveränderbarkeit).
- Keine neuen Abhängigkeiten (npm-Pakete etc.) ohne kurze Erwähnung, wofür.
