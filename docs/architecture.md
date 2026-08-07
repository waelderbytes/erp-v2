# ERP-System – Architektur-Grundlagen

Stand: Erstentwurf. Dieses Dokument hält die getroffenen Architekturentscheidungen fest,
damit jedes neue Modul (auch von Drittentwicklern in anderen Sprachen) sich daran hält.

## 1. Grundprinzipien

- **Modularer Monolith mit klaren Service-Grenzen**: Jedes fachliche Modul (Auth, Zeiterfassung,
  Projekte, Abrechnung, ...) ist ein eigener NestJS-"Service" im Monorepo. Services kommunizieren
  NICHT direkt über Code-Imports miteinander, sondern ausschließlich über:
  1. REST-APIs (synchron, für Anfragen/Antworten)
  2. RabbitMQ-Events (asynchron, für Zustandsänderungen, z. B. "Zeiteintrag erstellt")
- **API-first**: Jedes Modul definiert seinen Vertrag über OpenAPI (Swagger). Dadurch kann ein
  Modul theoretisch auch in einer anderen Sprache (z. B. .NET, Go) nachgebaut werden, solange es
  den gleichen REST-Vertrag und die gleichen Event-Contracts implementiert.
- **Multi-Tenancy: 1 Datenbank pro Kunde (Tenant)**. Das bedeutet: Es gibt eine zentrale
  "Control-Plane"-Datenbank (Tenant-Verzeichnis, Abo-Status, welche Module gebucht sind) und
  pro Kunde eine eigene, isolierte PostgreSQL-Datenbank mit den eigentlichen Geschäftsdaten.
  Vorteil: Einfaches Self-Hosting (Kunde bekommt exakt seine eine DB), maximale Datenisolation
  (wichtig für DSGVO), einfacheres Backup/Restore pro Kunde.
- **Control-Plane-DB enthält NUR Tenant-Verzeichnis + Abo-/Modul-Status – keine
  Personen-/Geschäftsdaten.** Benutzerkonten (Login, Passwort-Hash, Rollen) liegen
  vollständig und ausschließlich in der jeweiligen Tenant-DB, nicht zentral (siehe auch
  Abschnitt 4, Datenhaltung & DSGVO). Die Tenant-DB ist dadurch für Authentifizierung
  komplett eigenständig.
- **Kein zentraler Identity-Provider (kein Keycloak), eigener Auth-Service pro Deployment.**
  Entscheidung 07.08.2026: anders als ERP v1 (zentrales Keycloak als gemeinsamer IdP für alle
  Instanzen) bekommt jedes Tenant-Deployment einen eigenen NestJS-Auth-Service (Passport.js +
  JWT + Refresh-Token, eigene `users`/Rollen-Tabellen in der Tenant-DB). Gründe: (1) schlanker
  fürs Self-Hosting – kein zusätzlicher Java-Dienst mit eigener DB/eigenem Patch-Bedarf, (2)
  die feingranulare RBAC-Logik (Modul-/Datensatz-Rechte) muss ohnehin selbst gebaut werden,
  Keycloak nimmt nur die reine Authentifizierung ab, (3) weniger Angriffsfläche/Betriebsaufwand.
  Konsequenz für den Login-Flow: welche Tenant-DB für einen Login-Versuch zuständig ist, wird
  NICHT zentral nachgeschlagen, sondern ergibt sich aus der Instanz-Subdomain – jedes
  Tenant-Deployment ist beim Aufsetzen fest mit genau einer Tenant-DB verdrahtet (Umgebungs-
  variable), der dortige Auth-Service kennt nur seine eigene DB. Bewusst nicht als Sackgasse
  angelegt: SSO/OIDC-Anbindung (z. B. für größere Industriekunden mit eigenem Active
  Directory) lässt sich später als zusätzlicher, optionaler Login-Weg ergänzen, ohne diese
  Kernentscheidung umzubauen.
- **Modul-Lizenzierung**: Ob ein Tenant Zugriff auf ein Modul hat, wird zentral in der
  Control-Plane-DB (Tabelle `tenant_modules`) gepflegt und über einen Guard/Interceptor in
  jedem Service geprüft (Middleware fragt beim Start/Request die Control-Plane ab bzw. cached
  das Ergebnis). Das ist die EINZIGE Stelle, an der ein Tenant-Deployment mit der Control-Plane
  kommuniziert – für reines Self-Hosting ohne jede Anbindung an eure Infrastruktur braucht es
  dafür perspektivisch einen Offline-Modus (z. B. signierte Lizenzdatei statt Live-Check, siehe
  Referenz-Ansatz in ERP v1); aktuell noch offen, siehe Abschnitt 9.

## 2. Frontend & Multi-Device-Strategie

- **Responsive Web-App als PWA (Progressive Web App), keine nativen Apps.** Läuft im
  Browser auf Smartphone, Tablet und PC über dieselbe Codebasis. Als PWA installierbar
  (App-Icon, Vollbild-Darstellung ohne Browser-Rahmen), mit Offline-Caching wichtiger
  Daten über Service Worker und späterer Option auf Push-Benachrichtigungen.
- **Framework: React.** Läuft als eigene Nx-App (`apps/web`) im Monorepo, spricht
  ausschließlich über die REST/OpenAPI-Verträge der Backend-Services (siehe API-first-
  Prinzip oben) – keine direkte DB- oder Backend-Code-Kopplung.
- **Mobile-first responsives Design**: Layouts werden für kleine Bildschirme entworfen
  und für größere erweitert, nicht umgekehrt – da laut Anforderung alle Gerätegrößen
  gleichermaßen wichtig sind.
- **Kein natives App-Store-Investment vorerst.** Grund: Aufwand für getrennte iOS/
  Android-Codebasis steht in keinem Verhältnis zum Nutzen ohne konkretes Offline-
  Pflicht-Szenario. Falls später doch nötig (z. B. Marketing/Store-Präsenz), ist mit
  React Native ein Teil der React-Logik wiederverwendbar – keine Sackgasse.
- Kamerazugriff (z. B. für Beleg-Scan im DMS-Modul) funktioniert über moderne mobile
  Browser ohne native App.
- Noch offen: konkrete UI-Komponenten-Bibliothek (z. B. MUI, shadcn/ui) – wird bei
  Beginn der Frontend-Umsetzung entschieden, nicht vorab geraten.

## 3. Verzeichnisstruktur (Nx-Monorepo)

```
erp-system/
├── apps/
│   ├── web/                # React-Frontend (PWA, responsive, einzige UI für alle Geräte)
│   ├── api-gateway/       # Einstiegspunkt: Routing, Auth-Check, Rate-Limiting
│   ├── auth-service/      # Benutzerverwaltung, Tenant-Verwaltung, Login/JWT
│   ├── timetracking-service/  # (geplant) Zeiterfassung
│   ├── project-service/       # (geplant) Auftrags-/Projektverwaltung
│   └── billing-service/       # (geplant) Modul-Abo-Verwaltung, Stripe-Anbindung
├── libs/
│   ├── shared/            # Gemeinsame DTOs, Event-Contracts, Interfaces
│   └── common/            # Guards, Decorators, Exception-Filter (später)
├── docs/                  # Architektur- und Betriebsdokumentation
├── docker-compose.yml      # Lokale Entwicklungs-/Self-Hosting-Umgebung
└── .env.example
```

## 4. Datenhaltung & DSGVO

- **Trennung Control-Plane vs. Tenant-Daten**: Personenbezogene Geschäftsdaten (Mitarbeiter,
  Zeiteinträge, Kunden) liegen NIE in der Control-Plane-DB, sondern ausschließlich in der
  jeweiligen Tenant-DB. Das erleichtert "Recht auf Löschung" (Art. 17 DSGVO): Löschung eines
  Tenants = Löschung genau einer DB.
- **Auftragsverarbeitung**: Bei gehostetem Betrieb muss ein AVV (Auftragsverarbeitungsvertrag)
  mit jedem Kunden abgeschlossen werden – das ist organisatorisch, nicht technisch, aber die
  Architektur muss es unterstützen (z. B. Export-Funktion, Lösch-Funktion, Audit-Log).
- **Verschlüsselung**: Datenverbindungen TLS-only, Datenbank-Backups verschlüsselt at rest.
  Details folgen in einem eigenen Security-Dokument (noch zu erstellen).

## 5. Audit-Log / Änderungsprotokoll (Pflicht, gilt für ALLE Daten, nicht nur personenbezogene)

Grundsatzentscheidung: Keine Änderung an irgendeiner Entität (Artikel, Preise, Belege,
Benutzer, Einstellungen – ausnahmslos alles) darf möglich sein, ohne dass sie protokolliert
wird. Das darf nicht von der Disziplin einzelner Modul-Entwickler abhängen ("bitte dran
denken, zu loggen"), sondern muss architektonisch erzwungen werden.

- **Mechanismus: Datenbank-Trigger, nicht Application-Code.** Ein generischer
  PostgreSQL-Trigger (PL/pgSQL) wird auf JEDE Tabelle einer Tenant-DB gelegt und schreibt bei
  INSERT/UPDATE/DELETE automatisch einen Eintrag in eine zentrale `audit_log`-Tabelle
  (Spalten u. a.: `table_name`, `record_id`, `operation`, `old_data` JSONB, `new_data` JSONB,
  `changed_by`, `changed_at`). Vorteil gegenüber reinem Application-Code-Logging: Ein Trigger
  greift IMMER, auch bei direktem DB-Zugriff, fehlerhaftem Code oder vergessenem Logging-Aufruf
  in einem neuen Modul. Reines App-Code-Logging wäre umgehbar – das widerspricht der Anforderung.
- **"Wer hat's gemacht" im Trigger verfügbar machen**: Die Anwendung setzt zu Beginn jeder
  DB-Transaktion die aktuelle Benutzer-ID in die Postgres-Session (`SET LOCAL app.current_user_id
  = '<user-id>'`), der Trigger liest das aus und schreibt es mit ins Audit-Log.
- **Audit-Log selbst ist unveränderlich**: Auf der `audit_log`-Tabelle werden per DB-Rechten
  UPDATE und DELETE grundsätzlich verboten (auch für Admins) – nur INSERT ist erlaubt.
  Das erfüllt gleichzeitig die GoBD-Anforderung der Nachvollziehbarkeit.
- **Gilt pro Tenant-DB** (siehe Multi-Tenancy-Modell) – jede Kunden-Datenbank hat ihr eigenes,
  vollständiges Änderungsprotokoll. Für Control-Plane-Daten (z. B. Rollenänderungen, Tenant-
  Modul-Buchungen) gilt derselbe Mechanismus in der Control-Plane-DB.
- **Konsequenz für die Entwicklung**: Rohes SQL direkt an der ORM vorbei ist zu vermeiden bzw.
  muss ebenfalls durch dieselbe DB-Session laufen, sonst fehlt die User-Zuordnung im Log.
- Noch offen (nicht raten, wird bei Umsetzung konkretisiert): Aufbewahrungsstrategie für sehr
  große Audit-Log-Tabellen (Partitionierung? Archivierung nach X Jahren, unter Beachtung der
  10-Jahres-GoBD-Frist für Beleg-relevante Einträge).

## 6. Nummernkreis-Engine (konkretisiert, Referenz: eigenes ERP v1)

Quelle: Auswertung des bestehenden Repos `waelderbytes-suite` (ERP v1, FastAPI/Python,
nicht NestJS – Code selbst nicht direkt übernehmbar, Logik/Mechanismus aber praxiserprobt
und wird hiermit als Zielverhalten für die NestJS-Umsetzung übernommen).

- **Race-Condition-Sicherheit über pessimistischen Row-Lock**: Beim Vergeben einer Nummer
  wird die betreffende Zeile der Nummernkreis-Tabelle mit `SELECT ... FOR UPDATE` gesperrt,
  `next_value` erhöht, anschließend committet. Kein optimistisches Locking/Retry nötig, kein
  separater Advisory-Lock – ein normaler Row-Lock auf die Nummernkreis-Zeile reicht, da jede
  Vergabe ohnehin sequenziell durch genau diese eine Zeile muss.
- **Tabelle `nummernkreis`** (pro Tenant-DB): `id, entity_key (z. B. "kunden", "lieferanten",
  "artikel", oder Beleg-Typ wie "bestellung"), label, prefix, start_value, next_value, stellen
  (Mindest-Stellenanzahl mit führenden Nullen, z. B. "AB 00001" statt "AB 1"), created_at,
  updated_at`. `entity_key` ist unique.
- **Idempotentes Anlegen**: Vor jedem Lese-/Vergabe-Zugriff wird geprüft, ob für alle bekannten
  Entitäten/Belegtypen bereits ein Nummernkreis-Datensatz existiert, fehlende werden mit
  Default-Werten (leeres Prefix, Start 1) automatisch angelegt. Kein separater Seed-Migrationsschritt
  nötig, neue Beleg-Typen/Module bekommen ihren Nummernkreis automatisch beim ersten Zugriff.
- **Strikte Trennung Vorschlag vs. Reservierung – wichtige gelernte Lektion aus ERP v1**:
  Eine reine Lese-Funktion liefert die nächste Nummer NUR ZUR ANZEIGE (z. B. Live-Vorschau
  im Formular, während der Nutzer noch Angaben macht), OHNE den Zähler hochzuzählen und
  OHNE Lock. Das tatsächliche Speichern eines Datensatzes muss immer über die gelockte
  Reservierungsfunktion laufen, die den Zähler wirklich erhöht. Grund: in ERP v1 gab es einen
  echten Produktivbug, bei dem der ungeprüft übernommene Vorschlagswert beim Speichern nicht
  erneut reserviert wurde – der Zähler blieb stehen, zwei Datensätze bekamen dieselbe Nummer,
  Unique-Constraint-Fehler beim zweiten. Diese Trennung ist ab der ersten Implementierung in
  der NestJS-Version einzuhalten, nicht erst nach einem eigenen vergleichbaren Bug nachzuziehen.
- **Manuelle Nummernvergabe zulassen, aber gegen den Zähler absichern**: Wird statt des
  Vorschlags eine abweichende, gültige Nummer manuell eingegeben (z. B. bei Altdaten-Übernahme),
  wird der Zähler bei Bedarf auf `Laufnummer + 1` vorgezogen, damit dieselbe Nummer nicht
  später erneut automatisch vergeben wird.
- **Kategoriebasierte Artikelnummern (Schema XXX-YYY-lfd)**: Der Zähler hängt nicht an der
  Hauptgruppe allein, sondern an der KOMBINATION aus Haupt- und Untergruppe (eigene m:n-
  Zuordnungstabelle Hauptgruppe↔Untergruppe mit eigenem Zähler je Kombination). Dadurch zählt
  z. B. dieselbe Untergruppe "Schrauben" unter verschiedenen Hauptgruppen unabhängig
  (`BAU-SCH-00001` und `ELE-SCH-00001` parallel, statt eines global fortlaufenden Zählers je
  Untergruppe). Diese Entscheidung ersetzt die bisher unscharfe Formulierung "laufende Nr. je
  Hauptgruppe" in früheren Notizen.
- **Konfigurierbarkeit**: Prefix, Startwert und Stellenanzahl sind pro Tenant und pro
  Nummernkreis in den Firmen-/Systemeinstellungen änderbar (Modul Stammdaten/System-
  Einstellungen). Startwert-Änderung wird nur übernommen, wenn noch keine Nummer aus dem
  Kreis vergeben wurde (sonst Kollisionsgefahr mit bereits vergebenen Nummern).
- **Artikelnummern-Schema ("sprechend" ein-/ausschaltbar) – verschärft gegenüber ERP v1**:
  Firmeneinstellung `artikelnummern_schema` mit den Werten `einfach` (reiner Nummernkreis,
  z. B. "AB 00001") oder `kategorie` (sprechende Nummer XXX-YYY-lfd aus Haupt-/Untergruppen-
  Code + Zähler). Default `einfach`. In ERP v1 ist diese Einstellung jederzeit umschaltbar,
  auch wenn bereits Artikel existieren – dadurch können in einem Mandanten dauerhaft zwei
  unterschiedliche Nummernschemata parallel entstehen (alte Artikel behalten ihr Schema, neue
  bekommen das neue). Für die NestJS-Version wird das verschärft: Sobald in einer Tenant-DB
  mindestens ein Artikel existiert, ist `artikelnummern_schema` gesperrt (Änderungsversuch wird
  mit klarer Fehlermeldung abgelehnt, nicht nur im UI ausgegraut – Durchsetzung im Service, nicht
  nur in der Oberfläche). Vor dem ersten angelegten Artikel ist die Einstellung frei wählbar.
  `artikelnummern_stellen` (Stellenanzahl) bleibt wie in ERP v1 auch danach änderbar, da das nur
  die Formatierung künftiger Nummern betrifft, nicht das grundsätzliche Schema.

## 8. Hosting-Strategie (Entscheidung 07.08.2026)

Ausgangslage: ERP v1 (`waelderbytes-suite`) nutzt das Muster "1 vServer je Tenant-Instanz"
(`inst001.waelderbytes.de`, `inst002...`, jeweils ein komplett eigener Server). Für die
NestJS-Version wird das bewusst NICHT 1:1 übernommen.

- **Kein 1-Server-pro-Tenant von Anfang an.** Skaliert linear mit der Kundenzahl (Kosten,
  Patchen, Docker-Updates, Monitoring × N Server) und braucht pro Tenant für echte
  Ausfallsicherheit sogar mehrere Server – nicht sinnvoll beim Start mit einem Kunden.
- **Auch kein einzelner "großer" Server als Ersatz.** Ein einzelner Host löst zwar das
  Vermischen im Home-Verzeichnis, aber NICHT Ausfallsicherheit/Load Balancing – dafür sind
  zwingend mindestens zwei Hosts plus etwas davor nötig, das Traffic verteilt/bei Ausfall
  übernimmt. Ein Server bleibt immer Single Point of Failure, unabhängig von seiner Größe.
- **Gewählter Zwischenschritt**: Ein (angemessen dimensionierter, nicht überdimensionierter)
  vServer, darauf aber pro Tenant ein eigener, sauber getrennter Docker-Compose-Stack
  (eigene `.env`, eigene benannte Volumes, eigene Tenant-DB – Trennung passt zur bereits
  getroffenen 1-DB-pro-Tenant-Entscheidung), alle über einen zentralen Reverse Proxy
  (Traefik, wie in ERP v1 bereits erprobt) geroutet. Damit passen mehrere Tenants sauber
  getrennt auf denselben Host, ohne dass jeder neue Kunde einen neuen Server braucht.
- **Load Balancing/HA bewusst zurückgestellt**, bis Kundenzahl/SLA-Anforderungen es
  rechtfertigen. Der spätere Ausbauschritt ist ein echtes Kubernetes-Cluster mit mehreren
  Nodes (Architektur ist laut Abschnitt 3 bereits "K8s-fähig vorbereitet") – jetzt vorab
  eine HA-Infrastruktur für einen einzelnen Kunden aufzubauen wäre verfrühtes
  Overengineering.
- **Konkreter Server (Stand 07.08.2026)**: Hetzner Cloud, Typ CPX22 (2 vCPU, 4 GB RAM,
  80 GB NVMe-SSD), Standort Deutschland (Nürnberg/Falkenstein) – bestellt und läuft
  (Stand 07.08.2026). Anbieterwahl bewusst auf Hetzner statt weiter ZAP-Hosting
  (bisheriger privater Anbieter des Nutzers), da Hetzner Cloud auf Business-/GDPR-Anforderungen
  ausgelegt ist (SLA, ISO/IEC-27001-zertifizierte Standorte) und der Nutzer dort bereits eine
  Domain verwaltet – ein Anbieter statt zwei getrennter Konten/Rechnungsadressen.
- **Marketing-Website (`apps/website`) darf mit auf denselben Server** – unkritisch, geringe
  Last. Zentrale Identitäts-/Lizenz-Dienste dagegen bewusst NICHT mit auf den ersten
  Tenant-Server packen (entfällt für den Auth-Teil ohnehin durch die Keycloak-Entscheidung
  oben, siehe Abschnitt 1) – falls doch ein zentraler License-Service für Modul-Buchung
  gebraucht wird (siehe Modul-Lizenzierung, Abschnitt 1), spätestens beim zweiten
  Tenant-Server auf einen eigenen kleinen Host trennen, damit ein Ausfall/Überlastung eines
  einzelnen Tenant-Servers nicht die zentrale Lizenzprüfung für alle anderen Tenants mit
  runterreißt.

## 9. Offene Punkte (bewusst noch nicht entschieden – nicht raten, sondern klären)

- Konkrete Rechte-/Rollen-Modell (RBAC vs. ABAC) – noch zu spezifizieren
- Zahlungsanbieter für das Abo-Modell (Stripe? Andere?) – noch zu klären
- Genaues Provisioning: Wie wird bei Self-Hosting eine neue Tenant-DB automatisch angelegt?
- Backup-Strategie im gehosteten Betrieb
- UI-Komponenten-Bibliothek fürs React-Frontend
- Speicherort/Storage-Lösung für Dokumentenanhänge (siehe feldkatalog.md, Tabelle `dokument`)
- ~~Konkreter Server-Anbieter/Tarif für den ersten vServer~~ – erledigt, siehe Abschnitt 8
  (Hetzner CPX22, bestellt und läuft)
- Rechnungsadresse/Registrierung als Unternehmen beim gewählten Hosting-Anbieter – rein
  organisatorisch, vom Nutzer selbst zu erledigen (Login-Zugangsdaten, Zahlungsdaten)
- Offline-Lizenzmodus für reines Self-Hosting (signierte Lizenzdatei statt Live-Check gegen
  die Control-Plane) – in ERP v1 als späterer Schritt vorgesehen, für V2 noch nicht entschieden

Diese Punkte werden erst entschieden, wenn sie konkret angegangen werden – keine Annahmen
im Code, bis sie geklärt sind.
