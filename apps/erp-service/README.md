# erp-service

Warenwirtschaft-Module: Artikelstamm + Kunden-/Lieferantenstamm + Lagerverwaltung +
Einkauf/Bestellwesen (siehe docs/module-uebersicht.md Phase 1). Nutzt dieselbe
Tenant-DB wie auth-service, eigene Migrations-Historie (migrationsTableName
"migrations_erp_service").

## Enthaelt
- Nummernkreis-Engine (generisch, Row-Lock) - docs/architecture.md Abschnitt 6
- Kategoriebasierte Artikelnummern (Zaehler je Haupt-/Untergruppen-Kombination)
- Firma-Singleton mit Sperr-Logik fuer artikelnummern_schema
- Artikel-CRUD, Artikel-Lieferant-Zuordnung + Favorit
- Kunde/Lieferant-CRUD (anlegen/liste/find) inkl. Adressen/Kontakte (nested beim
  Anlegen), Kundenbewertung (Sterne je Kriterium, siehe feldkatalog.md Abschnitt 2.5)
- Lagerverwaltung: Lagerorte, Bestand je Artikel+Lager, Bewegungs-Ledger
  (Wareneingang/Warenausgang/Umbuchung/Inventurkorrektur) - Buchungen sind
  race-condition-sicher per Row-Lock (gleiches Muster wie die Nummernkreis-Engine),
  Warenausgang/Umbuchung lehnen negativen Bestand mit klarer Fehlermeldung ab,
  Inventurkorrektur darf das bewusst umgehen (Zweck: Bestand auf Ist-Wert setzen)
- Einkauf/Bestellwesen: Bestellungen an Lieferanten (Kopf+Positionen,
  Nummernkreis 'bestellungen'), Status-Workflow offen -> bestellt ->
  teilweise_geliefert/abgeschlossen, Wareneingang auf eine Bestellposition bucht
  atomar sowohl gelieferte_menge als auch den echten Lagerbestand (ueber
  lagerbewegung.service.ts in derselben Transaktion, referenz_typ/referenz_id auf
  lagerbewegung verlinkt zur Bestellposition)
- RBAC scharf: modul_key "artikelstamm" / "kunden" / "lieferanten" / "lager" /
  "einkauf"

## Bekannte Einschraenkungen (bewusst, nicht vergessen)
- Keine i18n-Mehrsprachigkeit bei Artikel-`bezeichnung`
- `einheit`/`steuersatz` noch keine FKs auf eigene Stammdaten (existieren noch nicht)
- Kein Update/Löschen fuer Kunde/Lieferant/Artikel/Lager - nur Anlegen/Lesen (MVP)
- Lieferantenbewertung (analog Kundenbewertung) nicht umgesetzt, Datenmodell
  (`bewertungskriterium.entity_type`) ist dafuer vorbereitet
- Lagerverwaltung: keine Lagerplatz-Feingranularitaet (nur Lager-Ebene), keine
  Bewertung (FIFO/LIFO/Ø - kommt mit "Preisfindung"/Bilanzierung spaeter), keine
  Mindestbestand-/Meldebestand-Logik
- Einkauf: keine Teil-Stornierung einzelner Positionen, kein Genehmigungsprozess,
  kein Preisvergleich/Anfragen-Workflow (MVP)
- `libs/common`-Code hier unter `src/common/` dupliziert (Docker-Build-Context-Grund)
