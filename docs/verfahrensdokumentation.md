# Verfahrensdokumentation nach GoBD

Stand: Skelett – wird parallel zu jedem Modul befüllt, nicht nachträglich am Ende.
Grundlage: BMF-Schreiben v. 28.11.2019 (GoBD), Rz. 153 – vier Bestandteile. Es gibt
keine gesetzlich vorgeschriebene Gliederung, aber diese vier Teile gelten als
Standard-Erwartung bei einer Betriebsprüfung.

**Wichtig:** Diese Dokumentation muss dem tatsächlich eingesetzten Verfahren
entsprechen und bei Änderungen historisch nachvollziehbar aktualisiert werden
(alte Versionen bleiben über Git-Historie nachvollziehbar – siehe CHANGELOG.md).
Auch als Kleinunternehmer besteht die Pflicht zur Verfahrensdokumentation, sobald
steuerrelevante digitale Prozesse (z. B. E-Rechnungen) genutzt werden – der Umfang
darf sich aber an der Betriebsgröße orientieren.

---

## Teil 1: Allgemeiner Teil

- Beschreibung der Geschäftstätigkeit und der steuerlichen Pflichten des jeweiligen
  Tenants/Unternehmens: **offen** – unternehmensspezifisch, wird pro Tenant befüllt,
  nicht pauschal für das Software-Produkt.
- Zuständigkeit für Pflege dieser Verfahrensdokumentation: **offen**, zu klären.
- Änderungs- und Versionierungskonzept für diese Dokumentation selbst: erfolgt über
  Git-Historie dieses Repos (Commits mit `docs(compliance): ...`, siehe Regeln.md) +
  Versionsnummer in CHANGELOG.md.
- Geltungsbereich: alle steuerrelevanten Module (aktuell geplant: Verkauf/Belegkette,
  Debitoren/Kreditoren, Artikelstamm/Warenwirtschaft, Zeiterfassung als Vorsystem).

## Teil 2: Anwenderdokumentation (fachliche Prozesse)

Beschreibt, WAS die Anwender im System tun – wird 1:1 aus dem Benutzerhandbuch
(`docs/benutzerhandbuch.md`) gespeist bzw. verlinkt, damit es nicht doppelt gepflegt
werden muss. Pro Modul wird bei dessen Fertigstellung ergänzt:

| Modul | Anwenderdoku vorhanden? |
|---|---|
| Auth/Benutzerverwaltung | ⬜ offen |
| Artikelstamm | ⬜ offen |
| Preisfindung | ⬜ offen |
| Lagerverwaltung | ⬜ offen |
| Belegkette/Rechnung | ⬜ offen |

## Teil 3: Technische Systemdokumentation

- Systembeschreibung: siehe `docs/architecture.md` (Backend-Stack, Datenbankmodell,
  Multi-Tenancy, Event-System)
- Eingesetzte Hard-/Software: PostgreSQL 16, RabbitMQ, NestJS/Node.js – konkrete
  Versionen werden dokumentiert, sobald der Workspace real initialisiert ist (siehe
  README.md, "Nächste Schritte").
- Schnittstellenbeschreibung: REST/OpenAPI-Verträge pro Service (Swagger, automatisch
  generiert unter `/api/docs` je Service)
- Datenmodell je Modul: wird bei Modul-Fertigstellung als ER-Diagramm/Entity-Liste
  ergänzt

## Teil 4: Betriebsdokumentation (inkl. Internes Kontrollsystem/IKS)

- **Zugriffsberechtigungen**: RBAC-Modell (Details noch offen, siehe
  module-uebersicht.md Punkt "Offene Fragen")
- **Erfassungs-/Verarbeitungskontrollen**: Audit-Log (DB-Trigger-basiert, siehe
  architecture.md Abschnitt 4) protokolliert jede Änderung inkl. Verursacher
- **Unveränderbarkeit festgeschriebener Belege**: siehe architecture.md, GoBD-Punkt
  in der Cross-Cutting-Tabelle der module-uebersicht.md
- **Datensicherungskonzept (Backup)**: **offen** – noch nicht spezifiziert (siehe
  offene Punkte in architecture.md)
- **Vier-Augen-Prinzip** bei kritischen Vorgängen (z. B. Stornos, Löschungen): **offen**
  – noch nicht entschieden, ob/wo erforderlich
- **Aufbewahrungsfristen**: 10 Jahre für steuerrelevante Unterlagen, technisch über
  Backup-/Archivierungsstrategie sicherzustellen (noch offen)

---

## Änderungshistorie dieser Verfahrensdokumentation

| Datum | Änderung |
|---|---|
| 2026-08-06 | Skelett angelegt (4-Teile-Struktur), noch keine unternehmensspezifischen Inhalte |
