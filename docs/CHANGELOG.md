# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/), Versionierung
nach [Semantic Versioning](https://semver.org/lang/de/) (MAJOR.MINOR.PATCH).

Solange sich das Projekt in der Planungs-/Grundgerüst-Phase befindet (< 1.0.0), sind
auch MINOR-Versionssprünge (0.X.0) potenziell breaking – erst ab 1.0.0 gilt SemVer
im vollen Sinn.

## [Unreleased]

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
