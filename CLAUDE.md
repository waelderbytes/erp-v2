# Regeln.md – Arbeitsweise für Claude in diesem Projekt

Gilt für jede Coding-Session in diesem Repository, unabhängig davon, welches Modul
gerade bearbeitet wird oder in welchem Chat.

## 0. Wichtiger Hinweis zur Umgebung

- Im claude.ai-Web-/Mobile-Chat (wie diesem hier) ist die Ausführungsumgebung eine
  isolierte, temporäre Sandbox: kein Zugriff auf das echte GitHub-Repo, keine
  gespeicherten Zugangsdaten, Dateisystem setzt sich zwischen Chats zurück. Hier
  können Dateien erstellt und lokal committet, aber NICHT zum echten Remote gepusht
  werden.
- Der vollständige Workflow inkl. Push funktioniert in **Claude Code** (CLI/Desktop-
  App, mit dem echten lokalen Repo und echten git-Credentials verbunden). Dort gelten
  die folgenden Regeln vollständig.
- Empfehlung: Diese Datei zusätzlich als `CLAUDE.md` im Repo-Root ablegen (oder darauf
  verlinken), damit Claude Code sie automatisch beim Start jeder Session lädt.

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
- Vor dem Push: falls Tests/Linter im Projekt existieren, müssen sie grün sein.

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
