# Modul-Übersicht & Roadmap – ERP-System

Stand: Planungsphase, vor erstem produktivem Code. Dieses Dokument ist die zentrale
Referenz für alle künftigen Chats zu einzelnen Modulen. Bei neuem Modul-Chat: dieses
Dokument + docs/architecture.md zuerst lesen.

## 0. Zielgruppe

Bewusst breit, beeinflusst Datenmodell-Entscheidungen (siehe Artikelart unten):
- Handwerk (klassische Lagerware, Handelsartikel)
- Industrie: Fertigung, Maschinen-/Anlagenbau, Projektbau (Stücklisten/Fertigungsartikel,
  projektbezogene Materialwirtschaft)
- Kleinere Dienstleister (Leistungen statt Lagerware, keine/kaum Bestandsführung)

Erster konkreter Kunde: Maschinenbauunternehmen mit sowohl Fertigungs- als auch
Serviceaufträgen (Wartung/Reparatur beim Kunden vor Ort) – beeinflusst die Ausgestaltung
von Auftragsarten und Einsatzplanung (siehe Modul "Projekt-/Auftragsverwaltung" unten).

Konsequenz: Kein starres, einheitliches Feldset für alle Branchen möglich. Basis-Entities
(Artikel, Kunde, Lieferant) bekommen einen gemeinsamen Kernfeldsatz + pro Tenant
konfigurierbare Zusatzfelder, statt alles hart zu codieren.

## 1. Getroffene Grundsatzentscheidungen (siehe docs/architecture.md für Details)

- Backend: NestJS/TypeScript, Nx-Monorepo
- DB: PostgreSQL, 1 DB pro Tenant, Control-Plane getrennt
- API: REST + OpenAPI, async Events über RabbitMQ
- Deployment: Docker Compose, K8s-fähig vorbereitet
- Artikel-/Belegnummern: technische ID (UUID) getrennt von sprechender Nummer;
  generische Nummernkreis-Engine (siehe Modul "Stammdaten/System" unten)
- Frontend: React, responsive/mobile-first, als PWA (Smartphone/Tablet/PC, keine
  nativen Apps vorerst)
- Artikelart als Basis-Unterscheidung im Artikelstamm-Datenmodell: Handelsware/
  Lagerartikel, Dienstleistung (kein Bestand, zeitbasiert), Fertigungsartikel/Baugruppe
  (mit Stückliste/BOM). Stücklisten-FUNKTIONALITÄT (Fertigungsaufträge, Mehrstufen-BOM,
  Materialbedarfsplanung) kommt erst in einer späteren Phase – das Datenmodell wird aber
  jetzt schon so angelegt, dass sie sich anschließen lässt, statt später umgebaut werden
  zu müssen.
- Feldkatalog Artikel/Kunde/Lieferant erarbeitet (siehe docs/feldkatalog.md): Zusatzfelder
  über Hybrid-Modell (Kernspalten + Standard-Erweiterungsspalten + JSONB für Sonderfälle),
  mehrere Adressen/Ansprechpartner je Kunde/Lieferant, n:m-Zuordnung Artikel↔Lieferant mit
  Favoriten-Kennzeichen, mehrdimensionale Kundenbewertung (Sterne je konfigurierbarem
  Kriterium).
- UI-Komponenten-Bibliothek entschieden (08.08.2026): **shadcn/ui + Tailwind**, wegen
  modernerer/neutralerer Optik als MUI (Material-Look) oder Ant Design (klassischer
  Enterprise-Dashboard-Look) und voller Kontrolle fürs spätere White-Label-Theming
  (CSS-Variablen-basiert). Theme-Auswahl (hell/dunkel/Farbschema) wird pro Benutzer
  möglich sein (nicht nur ein Tenant-weites Theme) - kommt als eigene UI zusammen mit
  Firmendaten/Benutzerprofil.

## 2. Cross-Cutting Concerns (betreffen ALLE Module, nicht separat verhandelbar)

| Thema | Anforderung |
|---|---|
| Mehrsprachigkeit (i18n) | UI-Texte und mehrsprachige Stammdatenfelder (z. B. Artikelbezeichnung) von Anfang an vorsehen |
| Theming/White-Label | CSS-Variablen-basiert, kein Hardcoding, für gehostete Kunden mit eigenem Branding |
| GoBD-Konformität | Unveränderbarkeit festgeschriebener Belege, Audit-Trail, 10 Jahre Aufbewahrung, Verfahrensdokumentation |
| DSGVO | Löschkonzept pro Tenant-DB, Audit-Log für personenbezogene Daten (siehe architecture.md) |
| Nummernkreise | Generische, pro Tenant konfigurierbare, race-condition-sichere Nummerngenerierung – Basis für Artikel-, Kunden-, Belegnummern |
| Rechtevergabe | RBAC als Basis (Rollenkatalog erarbeitet, siehe docs/rbac-rollenkatalog.md), später ggf. Rechte auf Datensatzebene (z. B. "nur eigene Kunden sichtbar") |
| Kleinunternehmerregelung (§19 UStG) | Firmen-Flag "Kleinunternehmer" steuert Rechnungslogik: keine USt ausweisen, Pflichthinweis, kein Vorsteuerabzug. Grenzen seit 2025: 25.000€ Vorjahresumsatz / 100.000€ laufendes Jahr (tatsächlicher Umsatz, keine Prognose). Bei Überschreiten unterjährig endet Status sofort ab diesem Umsatz. Betrifft alle Firmengrößen – System muss sowohl Kleinunternehmer als auch Regelbesteuerer abbilden. |
| Audit-Log / Änderungsprotokoll | Ausnahmslos JEDE Änderung an JEDER Entität wird geloggt (wer, wann, was, alt→neu) – erzwungen per DB-Trigger, nicht per Modul-Code (sonst umgehbar/vergessbar). Audit-Tabelle selbst unveränderlich (kein UPDATE/DELETE). Details siehe docs/architecture.md, Abschnitt 4. |

## 3. Modul-Liste mit Status

### Fundament (Phase 0)
| Modul | Status | Beschreibung |
|---|---|---|
| Auth/Benutzerverwaltung | 🚧 Benutzerverwaltung gebaut, lokal build-verifiziert, Server-Test steht aus | Bootstrap/Login/Refresh, argon2id, Benutzer/Rolle/Berechtigung-Schema inkl. Audit-Log-Trigger (Migration 0001), Kiosk-Login (Migration 0002). Neu: echte Benutzerverwaltung (/benutzer/*, /rollen/*) - Owner/Administrator legen Benutzer an, setzen Passwort/PIN, weisen Rollen zu/entziehen, exklusiv an modul_key 'benutzerverwaltung' gebunden (Migration 0003). Ersetzt manuelle DB-Updates fuer Personalnummer/PIN aus der Zeiterfassung-Entwicklung. Noch offen: Server-Verifikation (Migration 0003, End-to-End-Test), RBAC-Guard-Feinabgleich gegen rolle_berechtigung, REVOKE auf audit_log wirkt nicht gegen den DB-Owner-User (siehe architecture.md Offene Punkte) |
| Stammdaten/System-Einstellungen | ⬜ offen | Firmenstammdaten, Nummernkreise, Artikelnummern-Schema "einfach"/"kategorie" (gesperrt sobald erster Artikel existiert, siehe architecture.md Abschnitt 6), Steuersätze, mehrere Firmen/Niederlassungen, Kleinunternehmer-Flag (§19 UStG) |
| Nummernkreis-Engine | ✅ Konzept festgelegt | Row-Lock (`SELECT ... FOR UPDATE`) + strikte Trennung Vorschlag/Reservierung, siehe architecture.md Abschnitt 6 (Referenz: eigenes ERP v1) |

### Warenwirtschaft (Phase 1) — aktueller Fokus
| Modul | Status | Beschreibung |
|---|---|---|
| Artikelstamm | 🚧 Grundfunktionen implementiert, End-to-End live verifiziert (07.08.2026) | erp-service: Nummernkreis-Engine (einfach + kategoriebasiert XXX-YYY-lfd), Firma-Singleton mit Schema-Sperre, Artikel-CRUD, Artikel-Lieferant-Favorit, RBAC scharf (modul_key artikelstamm). Auf dem Server getestet: Login -> JWT -> Artikel anlegen -> Nummernkreis vergibt '00001' korrekt. Noch offen: i18n bezeichnung, Preisfindung-Anbindung, Variantenartikel, echte einheit/steuersatz-Stammdaten |
| Preisfindung | 🚧 Grundfunktionen implementiert, End-to-End live verifiziert (08.08.2026) | erp-service: Staffelpreise, kundenspezifische Preise, zeitlich begrenzte Aktionspreise über eine Tabelle (artikelpreis), Ermittlung nach Priorität (kundenspezifisch vor allgemein, dann prioritaet, dann höchste zutreffende Staffelstufe). Preise sind netto, USt-Ausweis (Kleinunternehmer/Regelbesteuerer) folgt in der späteren Belegkette. Auf dem Server getestet: Basispreis + Staffelpreis angelegt, Ermittlung liefert bei kleiner Menge den Basispreis, ab Staffelgrenze korrekt den günstigeren Staffelpreis. Damit ist Phase 1 (Warenwirtschaft) vollständig implementiert. |
| Lagerverwaltung | 🚧 Grundfunktionen implementiert, End-to-End live verifiziert (08.08.2026) | erp-service: Lagerorte (mit Standardlager-Kennzeichen), Lagerbestand je Artikel+Lager, unveränderliches Bewegungs-Ledger (Wareneingang/Warenausgang/Umbuchung/Inventurkorrektur). Buchungen race-condition-sicher per Row-Lock (gleiches Muster wie Nummernkreis-Engine). Auf dem Server getestet: Wareneingang (25), Bestandsgrenze korrekt mit 409 abgelehnt, Umbuchung zwischen zwei Lagern (2 verknüpfte Bewegungszeilen), Inventurkorrektur (Delta korrekt berechnet) - Endbestand per direkter DB-Abfrage bestätigt (12/10). Noch offen: Lagerplatz-Feingranularität, Bewertung (FIFO/LIFO/Ø), Mindestbestand/Meldebestand |
| Einkauf/Bestellwesen | 🚧 Grundfunktionen implementiert, End-to-End live verifiziert (08.08.2026) | erp-service: Bestellungen an Lieferanten (Kopf+Positionen, Nummernkreis-Anbindung), Status-Workflow offen→bestellt→teilweise_geliefert/abgeschlossen automatisch berechnet, Wareneingang auf Bestellposition bucht atomar Lieferstatus UND echten Lagerbestand. Auf dem Server getestet: Bestellung anlegen, bestellen, Teillieferung (Status→teilweise_geliefert), Überlieferung korrekt mit 400 abgelehnt, Restlieferung (Status→abgeschlossen) - Endbestand per DB-Abfrage bestätigt (62). Noch offen: Teil-Stornierung, Genehmigungsprozess, Preisvergleich (MVP) |
| Kunden-/Lieferantenstamm | 🚧 Grundfunktionen implementiert, End-to-End live verifiziert (08.08.2026) | erp-service: Kunde/Lieferant inkl. Adressen/Kontakte, Kundenbewertung (Sterne je Kriterium), Nummernkreis-Anbindung, artikel_lieferant jetzt echter FK inkl. UNIQUE(artikel_id, lieferant_id). Neue Endpoints POST/GET /artikel/:id/lieferant zum Anlegen/Auflisten der Zuordnung. Auf dem Server getestet: Kunde mit Adresse anlegen, Lieferant anlegen, Artikel-Lieferant-Zuordnung anlegen, als Favorit setzen - alles bestätigt inkl. DB-Kontrolle. Dabei zwei echte Bugs gefunden und behoben: (1) Migrations-Glob fand im kompilierten dist/-Ordner keine .js-Migrationsdateien, Migration 0002 lief nie; (2) fehlendes @JoinColumn auf mehreren ManyToOne-Relationen (artikel_lieferant, kunde_adresse/-kontakt/-bewertung, lieferant_adresse/-kontakt, artikelkategorie_zuordnung) führte zu "column ... does not exist", da TypeORM ohne @JoinColumn eine zusätzliche implizite Spalte erwartet. Noch offen: Update/Löschen-Endpoints, Debitoren-/Kreditorenbezug (Phase 3) |

### Kernmodule (Phase 2)
| Modul | Status | Beschreibung |
|---|---|---|
| Zeiterfassung | ✅ Backend vollständig implementiert, End-to-End live verifiziert (07.08.2026) | Eigenständiger Service (apps/zeiterfassung-service) mit unveränderlichem Buchungs-Ledger (zeitbuchung: kommt/geht/pause_beginn/pause_ende), Zustandsautomat verhindert unlogische Übergänge. Nutzt dieselbe RBAC/JWT-Prüfung wie erp-service (modul_key "zeiterfassung"). Kiosk-Login (Personalnummer+PIN, RFID-Schema vorbereitet) und der komplette Kommt/Pause/Geht-Zyklus sind auf dem Server bestätigt: Migration 0001 gelaufen, kommt gebucht, doppeltes kommt korrekt mit 409 abgelehnt, pause_beginn/pause_ende, geht - Arbeitszeit-/Pausenzeit-Berechnung über /zeitbuchung/heute geprüft. Noch offen: Frontend-UI für Zeiterfassung/Kiosk (nur Backend), GPS-Erfassung beim Buchen, Auftrag/Projekt-Bezug (auftrag_id-Spalte existiert, aber noch kein FK, da Auftrag-Tabelle fehlt). |
| Projekt-/Auftragsverwaltung | ⬜ offen | Konfigurierbare Auftragsarten statt starrem Schema: u. a. Fertigungsauftrag, Serviceauftrag/Wartung, Montage-/Bauprojekt, interner Auftrag. Jede Auftragsart kann eigene Zusatzfelder/Status-Workflows haben (gleicher Hybrid-Mechanismus wie bei Artikel/Kunde/Lieferant, siehe feldkatalog.md). Ressourcen-/Einsatzplanung (wer macht wann was, für wen) als gemeinsame Planungskomponente für alle Auftragsarten – deckt sowohl Baustellen-/Montageplanung als auch Servicetechniker-Dispo ab, statt zwei getrennte Spezial-Tools zu bauen. Detailkonzept (Kalenderansicht, Drag&Drop-Planung) folgt bei Umsetzung dieses Moduls. |

### Fertigung & Anlagenbau (spätere Phase, Datenmodell wird in Phase 1 vorbereitet)
| Modul | Status | Beschreibung |
|---|---|---|
| Stücklisten (BOM) | ⬜ offen | Mehrstufige Stücklisten für Fertigungsartikel/Baugruppen |
| Fertigungsaufträge | ⬜ offen | Materialbedarfsplanung, Rückmeldung, Projektbau-Bezug – nutzt die generische Auftragsart "Fertigungsauftrag" aus Phase 2 |

### Verkauf & Finanzen (Phase 3)
| Modul | Status | Beschreibung |
|---|---|---|
| Belegkette (Verkauf) | ⬜ offen | Angebot → Auftrag → Lieferschein → Rechnung, Teillieferung/-rechnung |
| Mahnwesen | ⬜ offen | Automatisierte Zahlungserinnerungen/Mahnstufen auf Basis offener Rechnungen, Mahntexte pro Stufe konfigurierbar |
| Vertragsverwaltung | ⬜ offen | Wiederkehrende Kundenverträge (z. B. Wartungsverträge für Maschinen), Laufzeiten, Erinnerung vor Ablauf/Verlängerung – erzeugt bei Bedarf automatisch Serviceaufträge (Bezug zu Phase 2) |
| E-Rechnung | ⬜ offen | XRechnung/ZUGFeRD (EN 16931), Pflicht ab 2027/2028 – siehe rechtliche Fristen unten |
| Debitoren/Kreditoren | ⬜ offen | ggf. an SKR03/SKR04-Kontenrahmen angelehnt |
| DATEV-Export | ⬜ offen | Übergabe an Steuerberater |

### Dokumente & Auswertung (Phase 4)
| Modul | Status | Beschreibung |
|---|---|---|
| Dokumentenmanagement (DMS) | ⬜ offen | Dateianhänge an Artikel/Belege/Kontakte, Scan-Import, Volltextsuche |
| Reporting/Auswertungen | ⬜ offen | Management-Dashboards + vorgefertigte Standard-Report-Vorlagen (nicht nur Rohdaten-Export) sowie Custom-Reports |

### Erweiterungen (Phase 5, je nach Bedarf)
| Modul | Status | Beschreibung |
|---|---|---|
| CRM | ⬜ offen | Kontakte, Vertriebschancen |
| HR-Erweiterungen | ⬜ offen | Urlaubsverwaltung, Personalstamm |
| Bankanbindung | ⬜ offen | FinTS/EBICS, Zahlungsabgleich |
| E-Commerce-/Multichannel-Anbindung | ⬜ offen | Anbindung an Onlineshops (z. B. Shopify, Amazon) für Bestellabgleich/Bestandssync – Relevanz hängt vom jeweiligen Tenant ab, daher spät in der Roadmap |
| Kassenfunktion (POS) | ⬜ offen | Direktverkauf/Barverkauf am Ladentisch, für Handwerksbetriebe mit Ladengeschäft relevant |

### Eigenes SaaS-Geschäftsmodell
| Modul | Status | Beschreibung |
|---|---|---|
| Billing/Abo-Verwaltung | ⬜ offen | Modul-Buchung, Zahlungsanbieter – muss vor Verkaufsstart stehen, Zeitpunkt flexibel |

## 4. Offene Fragen (bewusst ungeklärt, nicht raten)

- Zahlungsanbieter für Abo-Modell
- Genaues Rechte-Modell (RBAC-Rollen-Katalog)
- Provisioning-Automatisierung für Self-Hosting
- KI-gestützte Automatisierungen (z. B. Belegerkennung, automatisierte Vorschläge) – bei
  mehreren Wettbewerbsprodukten (Stand August 2026) vorhanden, bei uns noch nicht
  eingeplant. Nicht sofort umsetzen, aber im Hinterkopf behalten, ob Architektur einen
  späteren KI-Layer sauber andocken lässt.
- Leistungsverzeichnis/GAEB-Bezug (Ausschreibungsformat im Anlagenbau) – möglicherweise
  relevant für Maschinenbau-Zielkunden, aber nicht bestätigt/nicht beauftragt. Nicht raten,
  bei Bedarf mit dem Kunden klären.

## 5. Rechtlicher Kontext (Stand August 2026, Quelle: BMF/Wachstumschancengesetz)

- Seit 1.1.2025: Pflicht zum **Empfang** von E-Rechnungen (B2B, national)
- Ab 1.1.2027: Pflicht zur **Ausstellung** für Unternehmen mit Vorjahresumsatz > 800.000 €
- Ab 1.1.2028: Pflicht zur Ausstellung für alle B2B-Umsätze
- Format: XRechnung oder ZUGFeRD, konform zu EN 16931
- Kleinunternehmerregelung (§19 UStG): seit 2025 Grenzen 25.000€ (Vorjahr) / 100.000€ (laufendes Jahr, tatsächlicher Umsatz statt Prognose). Neugründer starten automatisch als Kleinunternehmer. Bei unterjährigem Überschreiten der 100.000€ endet der Status sofort ab diesem Umsatz.

## 6. Nächster Schritt

Vorschlag: RBAC-Rollen-Katalog ausarbeiten, danach GitHub-Repo anlegen für echten
Push-Workflow (siehe Regeln.md).
