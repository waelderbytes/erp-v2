# Feldkatalog – Artikel, Kunde, Lieferant

Stand: Ersterarbeitung, Antwort auf offenen Punkt aus `module-uebersicht.md` Abschnitt 4.
Ergänzt `architecture.md` (Nummernkreise, Audit-Log, DSGVO) und `module-uebersicht.md`
(Zielgruppe, Cross-Cutting Concerns) um konkrete Feldmodelle. Vor Umsetzung in Migrationen
mit `architecture.md` gegenlesen.

## 0. Grundsatz: Zusatzfelder-Mechanismus (Hybrid)

Getroffene Entscheidung: **Hybrid-Modell**.

- **Kernfelder**: feste Spalten, für alle Tenants/Branchen gleich, in diesem Dokument definiert.
- **Standard-Erweiterungsfelder**: ebenfalls feste Spalten, aber branchenspezifisch oft
  gebraucht (z. B. Gewicht/Maße bei Handelsware) – ebenfalls fest in der Tabelle, aber
  fachlich als "optional/nice-to-have" markiert.
- **Zusatzfelder (frei konfigurierbar)**: Spalte `custom_fields JSONB` je Tabelle, plus
  eine Metadaten-Tabelle `custom_field_definitions` pro Tenant:
  `id, entity_type (artikel/kunde/lieferant), field_key, label, data_type
  (text/number/date/boolean/select), required, sort_order, options (JSONB, für select)`.
- Auswertbarkeit: für Felder, die tenant-übergreifend häufig als "Zusatzfeld" genutzt werden
  und relevant für Reporting werden, kann später eine Migration sie zu echten Spalten machen
  (kein Sackgassen-Design).
- Der generische Audit-Trigger (siehe `architecture.md` Abschnitt 5) greift unverändert,
  da `custom_fields` nur eine normale Spalte ist – Änderungen am JSONB-Inhalt werden als
  `old_data`/`new_data`-Diff der ganzen Zeile mitprotokolliert.

## 1. Artikel (Artikelstamm)

### 1.1 Kernfelder

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | technischer Primärschlüssel, nie sprechend |
| `artikelnummer` | string | ja | sprechende Nummer, Schema `XXX-YYY-lfd` (Hauptgruppe-Untergruppe-laufend), aus Nummernkreis-Engine |
| `artikelart` | enum | ja | `handelsware` / `dienstleistung` / `fertigungsartikel` |
| `bezeichnung` | i18n-text | ja | Kurzbezeichnung, je unterstützter Sprache |
| `beschreibung` | i18n-text | nein | Langtext |
| `hauptgruppe_id` | FK | ja | Verweis Artikelgruppe (Hierarchie) |
| `untergruppe_id` | FK | nein | Verweis Artikel-Untergruppe |
| `einheit_id` | FK | ja (DB), aktuell nullable im DTO | Basis-Mengeneinheit, echte FK auf eigene `einheit`-Tabelle seit 08.08.2026 (vorher Freitext) - siehe module-uebersicht.md |
| `ean_gtin` | string | nein | Barcode, falls vorhanden |
| `steuersatz_id` | FK | ja (echte FK seit Migration 0015) | Verweis Steuersatz (0/7/19 %, Tabelle `steuersatz`, Migration 0014), unabhängig vom Kleinunternehmer-Flag der Firma - erledigt 08.08.2026, siehe module-uebersicht.md |
| `aktiv` | boolean | ja | Sperrkennzeichen, Default true |
| `bestandsgefuehrt` | boolean | ja | steuert, ob Lagerverwaltung greift (bei `dienstleistung` immer false) |
| `custom_fields` | JSONB | nein | siehe Abschnitt 0 |

### 1.2 Standard-Erweiterungsfelder (optional, feste Spalten)

| Feld | Typ | Beschreibung |
|---|---|---|
| `gewicht_kg` | numeric | ✅ umgesetzt (Migration 0013, 08.08.2026) - v. a. Handelsware/Fertigungsartikel |
| `laenge_mm` / `breite_mm` / `hoehe_mm` | numeric | ✅ umgesetzt (Migration 0013, 08.08.2026) - Abmessungen |
| `hersteller` | string | Herstellername, falls abweichend vom Lieferanten |
| `hersteller_artikelnummer` | string | |
| `mindestbestand` | numeric | ✅ umgesetzt (Migration 0013, 08.08.2026) - nur relevant wenn `bestandsgefuehrt = true` |
| `bomfaehig` | boolean | ✅ umgesetzt (Migration 0011, 08.08.2026) - true nur bei `fertigungsartikel`; Datenmodell-Vorbereitung für spätere Stücklisten-Funktionalität (siehe `module-uebersicht.md` Abschnitt 1) |

### 1.3 Beziehungstabellen (referenziert, nicht Teil des Artikel-Kerns)

- `artikel_preise` (Staffelpreise, Kunden-/Aktionspreise) – Detailmodell folgt im Modul Preisfindung.
- `artikel_lagerbestand` – Detailmodell folgt im Modul Lagerverwaltung.
- `stueckliste_position` – erst bei Umsetzung der Fertigungsphase, aber `fertigungsartikel`-Flag und `bomfaehig` bereits jetzt vorgesehen.

### 1.4 Artikel-Lieferant-Zuordnung (n:m, Tabelle `artikel_lieferant`)

Ein Artikel kann von mehreren Lieferanten bezogen werden; einer davon kann als
Favorit markiert werden (Stern-Icon in der UI).

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | |
| `artikel_id` | FK | ja | |
| `lieferant_id` | FK | ja | |
| `lieferanten_artikelnummer` | string | nein | Artikelnummer beim Lieferanten (für Bestellungen) |
| `einkaufspreis` | numeric | nein | zuletzt bekannter Einkaufspreis, Detailpreishistorie folgt im Modul Preisfindung |
| `lieferzeit_tage` | integer | nein | überschreibt ggf. den allgemeinen Wert aus `lieferant.lieferzeit_tage` |
| `ist_bevorzugt` | boolean | ja | Favorit-Kennzeichen (Stern); DB-Constraint: pro `artikel_id` darf höchstens ein Datensatz `ist_bevorzugt = true` haben (partial unique index) |

Reihenfolge in der UI: bevorzugter Lieferant zuerst, danach z. B. nach Einkaufspreis
sortiert. Umschalten des Favoriten setzt den vorherigen automatisch auf `false`
(Transaktion, kein manuelles Nachziehen nötig).

## 2. Kunde

Entscheidung: **mehrere Adressen** und **mehrere Ansprechpartner** pro Kunde, jeweils
eigene Tabelle (1:n).

### 2.1 Kernfelder (Tabelle `kunde`)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | technischer Primärschlüssel |
| `kundennummer` | string | ja | sprechende Nummer, eigener Nummernkreis |
| `typ` | enum | ja | `firma` / `privatperson` (steuert Pflichtfelder wie USt-IdNr.) |
| `firmenname` | string | bedingt | Pflicht wenn `typ = firma` |
| `vorname` / `nachname` | string | bedingt | Pflicht wenn `typ = privatperson`, sonst optional (Ansprechpartner separat) |
| `ust_idnr` | string | nein | Pflicht i. d. R. nur bei `typ = firma` und Regelbesteuerer |
| `steuernummer` | string | nein | |
| `waehrung` | enum/ISO-4217 | ja | Multi-Currency: Default `EUR`, aber pro Kunde änderbar (siehe Abschnitt 2.4) |
| `zahlungsziel_tage` | integer | nein | Default aus Firmenstammdaten, pro Kunde überschreibbar |
| `zahlungsart` | enum | nein | Überweisung/Lastschrift/... |
| `iban` | string | nein | bei Lastschrift/SEPA |
| `preisliste_id` | FK | nein | Verweis auf kundenspezifische Preisliste (Modul Preisfindung) |
| `sprache` | enum | ja | Kommunikationssprache für Belege (i18n) |
| `aktiv` | boolean | ja | Sperrkennzeichen |
| `custom_fields` | JSONB | nein | siehe Abschnitt 0 |

### 2.2 Adressen (Tabelle `kunde_adresse`, 1:n zu `kunde`)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | |
| `kunde_id` | FK | ja | |
| `typ` | enum | ja | `rechnung` / `lieferung` / `baustelle` / `sonstige` – mehrere `lieferung`/`baustelle` möglich (Anlagenbau: mehrere Baustellen) |
| `ist_standard` | boolean | ja | genau eine Standardadresse je Typ `rechnung` Pflicht |
| `strasse`, `plz`, `ort`, `land` | string | ja | Land als ISO-3166-Code |
| `zusatz` | string | nein | Adresszusatz (Gebäude, Etage, Werk-Bezeichnung) |

### 2.3 Ansprechpartner (Tabelle `kunde_kontakt`, 1:n zu `kunde`)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | |
| `kunde_id` | FK | ja | |
| `vorname` / `nachname` | string | ja | |
| `funktion` | string | nein | z. B. "Einkauf", "Projektleitung" |
| `telefon` / `mobil` / `email` | string | nein | |
| `ist_hauptkontakt` | boolean | ja | genau ein Hauptkontakt je Kunde empfohlen (Konvention, keine harte DB-Regel) |
| `zugeordnete_adresse_id` | FK | nein | optionaler Bezug auf konkreten Standort (z. B. Ansprechpartner je Baustelle) |

### 2.4 Multi-Currency – Konsequenzen

Da Multi-Currency von Anfang an gewünscht ist, ergeben sich Folgepunkte, die in den
jeweiligen Modulen (nicht hier) entschieden werden müssen – hier nur vermerkt, damit sie
nicht vergessen werden:

- Preisfindung/Belegkette: Beträge brauchen `betrag` + `waehrung`, ggf. zusätzlich
  `betrag_basiswaehrung` für Auswertungen/Buchhaltung.
- Wechselkurs-Quelle und -Zeitpunkt (Tageskurs bei Rechnungsstellung? EZB-Referenzkurs?)
  ist **offen und nicht Teil dieses Feldkatalogs** – wird im Modul Belegkette/Finanzen
  geklärt, nicht hier vorwegnehmen.
- GoBD: Wechselkurs muss bei Beleg-Festschreibung mit dokumentiert werden (Nachvollziehbarkeit).

### 2.5 Kundenbewertung (Sterne, mehrere Kriterien)

Mehrdimensionale Bewertung statt einem einzelnen Sternewert: jeder Kunde kann in
mehreren Kriterien (z. B. Zahlungsmoral, Zuverlässigkeit, Kommunikation) separat mit
1–5 Sternen bewertet werden. Kriterien-Katalog ist tenant-konfigurierbar, analog zu
den Zusatzfeldern in Abschnitt 0.

**Tabelle `bewertungskriterium`** (Katalog, pro Tenant konfigurierbar):

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | |
| `entity_type` | enum | ja | `kunde` (Modell so angelegt, dass später auch `lieferant` möglich ist) |
| `bezeichnung` | i18n-text | ja | z. B. "Zahlungsmoral" |
| `aktiv` | boolean | ja | |
| `sort_order` | integer | nein | Anzeigereihenfolge |

**Tabelle `kunde_bewertung`** (einzelne Bewertungswerte, 1:n zu `kunde` × `bewertungskriterium`):

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | |
| `kunde_id` | FK | ja | |
| `kriterium_id` | FK | ja | Verweis `bewertungskriterium` |
| `sterne` | smallint | ja | 1–5, DB-Check-Constraint |
| `kommentar` | text | nein | optionale Begründung |
| `bewertet_von` | FK (user) | ja | für Audit/Nachvollziehbarkeit, zusätzlich zum generischen Audit-Log |
| `bewertet_am` | timestamp | ja | |

Constraint: pro `kunde_id` + `kriterium_id` genau ein aktueller Wert (Unique), Historie
über das generische Audit-Log nachvollziehbar (keine eigene Historientabelle nötig).
Gesamt-/Durchschnittsbewertung eines Kunden wird in der UI/im Report berechnet, nicht
zusätzlich gespeichert (keine Redundanz, kein Update-Anomalie-Risiko).

## 3. Lieferant

Struktur analog Kunde (mehrere Adressen, mehrere Ansprechpartner), zusätzlich
einkaufsspezifische Felder.

### 3.1 Kernfelder (Tabelle `lieferant`)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | |
| `lieferantennummer` | string | ja | eigener Nummernkreis |
| `firmenname` | string | ja | |
| `ust_idnr` | string | nein | |
| `steuernummer` | string | nein | |
| `waehrung` | enum/ISO-4217 | ja | Default `EUR`, pro Lieferant überschreibbar |
| `zahlungsziel_tage` | integer | nein | |
| `zahlungsart` | enum | nein | |
| `iban` / `bic` | string | nein | für ausgehende Zahlungen |
| `bestellweg` | enum | nein | E-Mail/EDI/Portal – informativ, keine Automatisierung in Phase 1 |
| `mindestbestellwert` | numeric | nein | |
| `lieferzeit_tage` | integer | nein | Richtwert für Bestellwesen |
| `sprache` | enum | ja | für Bestelldokumente |
| `aktiv` | boolean | ja | |
| `custom_fields` | JSONB | nein | siehe Abschnitt 0 |

### 3.2 Adressen (Tabelle `lieferant_adresse`, 1:n)

Gleiche Struktur wie `kunde_adresse`, Typen: `rechnung` / `versand_von` / `werk` / `sonstige`.

### 3.3 Ansprechpartner (Tabelle `lieferant_kontakt`, 1:n)

Gleiche Struktur wie `kunde_kontakt`.

## 4. Dokumentenanhänge (Bezug zu Artikel, Kunde, Lieferant)

Dateianhänge werden nicht pro Entität separat modelliert, sondern über eine generische,
polymorphe Zuordnung – ein Anhang-Datensatz kann an Artikel, Kunde ODER Lieferant hängen
(später auch an Belege, siehe DMS-Modul Phase 4 in `module-uebersicht.md`).

**Tabelle `dokument`**

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | UUID | ja | |
| `entity_type` | enum | ja | `artikel` / `kunde` / `lieferant` (erweiterbar um `beleg` etc. in Phase 4) |
| `entity_id` | UUID | ja | Verweis auf den jeweiligen Datensatz (kein FK-Constraint über Tabellengrenzen hinweg möglich, Prüfung in Applikationslogik) |
| `dateiname` | string | ja | Original-Dateiname |
| `storage_key` | string | ja | Pfad/Objekt-Key im Datei-Storage (Ablageort selbst noch nicht entschieden, siehe Offene Punkte) |
| `mime_type` | string | ja | |
| `groesse_bytes` | bigint | nein | |
| `hochgeladen_von` | FK (user) | ja | zusätzlich zum generischen Audit-Log |
| `hochgeladen_am` | timestamp | ja | |
| `beschreibung` | text | nein | optionale Notiz |

- Zugriff/Sichtbarkeit folgt später dem RBAC-Modell (noch offen, siehe Abschnitt 4 unten
  bzw. `module-uebersicht.md`).
- Volltextsuche/Scan-Import (z. B. OCR für eingescannte Lieferantenrechnungen) ist Teil
  des DMS-Moduls (Phase 4), nicht Teil dieses Feldkatalogs – hier nur die Grund-Zuordnung
  zu Artikel/Kunde/Lieferant vorgemerkt, damit das Datenmodell nicht später umgebaut
  werden muss, wenn DMS umgesetzt wird (gleiches Prinzip wie bei Fertigungsartikel/BOM).

## 5. Offene Punkte aus diesem Feldkatalog (nicht raten, bei Bedarf klären)

- Wechselkurs-Handling (Quelle, Zeitpunkt, Rundungsregeln) – gehört ins Modul Belegkette/Finanzen.
- Ob `custom_field_definitions` pro Tenant oder pro Tenant+Modul verwaltet wird (Admin-UI dafür ist Teil vom Modul Stammdaten/System-Einstellungen, noch offen laut `module-uebersicht.md`).
- Migrationspfad einzelner Zusatzfelder zu echten Spalten (Prozess, nicht nur Technik) – noch nicht definiert.
- Ob `kunde`/`lieferant` bei identischer Firma dedupliziert/verknüpft werden sollen (manche ERPs führen "Geschäftspartner" als gemeinsame Basis-Entität mit Rollen Kunde/Lieferant) – bewusst noch nicht entschieden, da nicht abgefragt.
- Ob Lieferantenbewertung (analog Kundenbewertung) ebenfalls jetzt schon gebraucht wird oder erst später – Datenmodell (`entity_type` in `bewertungskriterium`) ist dafür vorbereitet, aber nicht beauftragt.
- Wer darf Kundenbewertungen abgeben/sehen (RBAC-Bezug) – wird im RBAC-Rollen-Katalog geklärt, nicht hier.

## 6. Nächster Schritt

Vorschlag: RBAC-Modell (Rollen-Katalog) als nächster offener Punkt aus `module-uebersicht.md`
Abschnitt 4, danach GitHub-Repo für echten Push-Workflow anlegen.
