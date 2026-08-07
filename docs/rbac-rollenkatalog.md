# RBAC-Rollenkatalog

Stand: Erster Entwurf (07.08.2026), bewusst grob – reicht, um den Auth-Service und die
ersten Guards von Anfang an richtig zu strukturieren, ohne die Feinausarbeitung (z. B.
Datensatz-Ebene) vorwegzunehmen. Ergänzt `architecture.md` (Cross-Cutting Concern
"Rechtevergabe") und ist Voraussetzung für den Auth-Service-Code.

## 1. Grundmodell

- **`rolle`**: `id, name, ist_system_rolle (bool), beschreibung`. System-Rollen (siehe
  Abschnitt 2) sind vordefiniert und nicht löschbar; ein Tenant kann zusätzlich eigene
  Rollen anlegen (spätere Ausbaustufe, nicht Teil des ersten Auth-Codes).
- **`berechtigung`**: granularer Rechte-Katalog je Modul: `modul_key` (z. B. "artikelstamm",
  "kunden", "lager", "zeiterfassung", seit 08.08.2026 auch "stammdaten" - siehe unten),
  `aktion` (`lesen` / `schreiben` / `loeschen` / `administrieren`). `administrieren` meint
  modul-eigene Einstellungen (z. B. Nummernkreis für Artikel), nicht System-weite
  Einstellungen.
- **`modul_key` "stammdaten"** (neu, Modul Stammdaten/System-Einstellungen): deckt
  Firma-/Steuersatz-/Nummernkreis-Endpoints ab (`firma.controller.ts`,
  `steuersatz.controller.ts`, `nummernkreis.controller.ts`). Bekommt aktuell KEINE
  Standard-Rolle explizit zugeteilt - dadurch praktisch Owner/Administrator vorbehalten
  (RbacGuard-Bypass, siehe Abschnitt 1 "Durchsetzung"), passend zum "System-Einstellungen"
  aus der Owner-Zeile in Abschnitt 2. Bei Bedarf kann "stammdaten:lesen" spaeter gezielt an
  z. B. Sachbearbeiter vergeben werden, ohne Codeänderung.
- **`rolle_berechtigung`**: m:n zwischen Rolle und Berechtigung.
- **`benutzer_rolle`**: m:n zwischen Benutzer und Rolle – ein Benutzer kann mehrere Rollen
  gleichzeitig haben (z. B. "Sachbearbeiter Warenwirtschaft" + "Lesend Finanzen").
- **Durchsetzung**: NestJS Guard liest die Rollen/Berechtigungen des angemeldeten Benutzers
  (aus der Tenant-DB, siehe architecture.md Abschnitt 1 – kein zentraler IdP) und prüft pro
  Endpoint die benötigte `modul_key`+`aktion`-Kombination. Modul-Lizenzierung (hat der Tenant
  das Modul überhaupt gebucht) ist ein separater, vorgelagerter Check gegen die Control-Plane
  (siehe architecture.md Abschnitt 1) – RBAC entscheidet erst danach über Benutzerrechte
  INNERHALB eines lizenzierten Moduls.

## 2. System-Rollen (vordefiniert, nicht löschbar)

| Rolle | Umfang |
|---|---|
| **Owner/Inhaber** | Alle Rechte in allen gebuchten Modulen, zusätzlich exklusiv: Abo-/Modul-Buchung verwalten, Firma/Tenant löschen, System-Einstellungen. Pro Tenant genau ein Owner beim Anlegen (Bootstrap-Benutzer), Übertragung später möglich. |
| **Administrator** | Alle Rechte in allen gebuchten Modulen (lesen/schreiben/löschen/administrieren) sowie Benutzerverwaltung (Benutzer anlegen, Rollen zuweisen) – aber NICHT Abo-Verwaltung/Tenant-Löschung (bleibt Owner vorbehalten). |
| **Sachbearbeiter** | Modulweise konfigurierbar: pro Modul lesen/schreiben, aber kein `administrieren` (z. B. keine Nummernkreis-Einstellungen) und kein `loeschen` standardmäßig (optional aktivierbar). Standard-Rolle für die meisten Mitarbeiter, z. B. "Sachbearbeiter Warenwirtschaft" mit Rechten nur in Artikelstamm/Lager/Einkauf. |
| **Lesend/Auditor** | Nur `lesen` über alle gebuchten Module, kein Schreiben irgendwo. Für Steuerberater-Zugriff, interne Kontrolle, Geschäftsführung ohne operative Eingabe. |
| **Außendienst/Techniker** | Eingeschränkt auf eigene Aufträge/Serviceaufträge und eigene Zeiterfassung (siehe Feldkatalog Dokument-Bezug/Projekt-Auftragsverwaltung) – kein Zugriff auf Finanzen, Preise, Debitoren/Kreditoren. Passt zum ersten Kunden (Maschinenbau mit Servicetechnikern vor Ort). "eigene" ist hier bewusst noch grob – echte Datensatz-Ebene (nur zugewiesene Aufträge sehen) ist die in Abschnitt 3 genannte spätere Ausbaustufe. |

## 3. Bewusst zurückgestellt (nicht Teil des ersten Auth-Service-Codes)

- **Rechte auf Datensatzebene** (z. B. "Außendienst sieht nur seine eigenen zugewiesenen
  Aufträge, nicht alle") – in `architecture.md` als Cross-Cutting Concern für später vermerkt.
  Erster Code arbeitet rein modulweise (RBAC), keine Datensatz-Filter-Logik.
  Nachrüstbar über einen zusätzlichen Scope-Parameter am Guard, kein Umbau der Grundtabellen
  nötig.
- **Eigene, vom Tenant frei definierbare Rollen** – Grundmodell (Abschnitt 1) ist bereits so
  angelegt, dass es möglich wäre (Rolle/Berechtigung generisch, nicht hart codiert), aber die
  Verwaltungs-UI dafür kommt erst mit dem Modul Stammdaten/System-Einstellungen.
- **Rollen-Vererbung/Hierarchie** (z. B. Administrator "erbt" automatisch alle Sachbearbeiter-
  Rechte) – aktuell wird jede Rolle explizit mit ihren Berechtigungen verknüpft, keine
  implizite Vererbung. Einfacher zu verstehen und zu debuggen, auch wenn das bei der Owner/
  Administrator-Pflege etwas mehr Handarbeit bedeutet (Berechtigungen beider Rollen bei einem
  neuen Modul explizit ergänzen).

## 4. Nächster Schritt

Dieser Katalog ist die Grundlage für den ersten echten Auth-Service-Code (NestJS,
Passport.js + JWT, siehe architecture.md Abschnitt 1) im neuen Repository.
