# WaelderBytes ERP V2

Nx-Monorepo (NestJS-Backend-Services, React-PWA-Frontend). Voll umfaengliches ERP-System
mit Auftrags-/Projektverwaltung und Zeiterfassung, modular buchbar, self-hostbar oder als
Abo gehostet.

## Vor dem Einstieg immer zuerst lesen

1. `CLAUDE.md` (= `docs/Regeln.md`) - Arbeitsweise/Commit-Regeln
2. `docs/architecture.md` - Architekturentscheidungen
3. `docs/module-uebersicht.md` - Roadmap & Modul-Status
4. `docs/feldkatalog.md` - Datenmodell Artikel/Kunde/Lieferant
5. `docs/rbac-rollenkatalog.md` - Rollen-/Rechtemodell

## Stand (07.08.2026)

Erstes Grundgeruest gepusht: Verzeichnisstruktur, Docker-Compose fuer Tenant-Deployment,
Auth-Service-Platzhalter mit RBAC-Grundmodell (System-Rollen als Konstanten). Noch KEIN
lauffaehiger Code (keine Migrationen, keine echten Endpoints) - das ist der naechste
Schritt (Artikelstamm bzw. Auth-Service-Grundfunktionen, siehe module-uebersicht.md).

## Lokale Entwicklung

```bash
docker compose up -d postgres rabbitmq
npm install --workspaces
npm run dev:auth-service
```

## Produktiv-Deployment (Tenant-Server)

Siehe `docs/architecture.md` Abschnitt 8 (Hosting-Strategie): pro Tenant ein eigener
Compose-Stack mit eigener `.env` (siehe `.env.example`), auf gemeinsamem Host hinter
Traefik.
