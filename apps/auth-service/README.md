# auth-service

Eigener JWT-Auth-Service (Passport.js, argon2id), pro Tenant-Deployment
eigenstaendig gegen die Tenant-DB. Kein zentraler IdP (siehe
docs/architecture.md Abschnitt 1).

## Enthält

- Entities: Benutzer, Rolle, Berechtigung (m:n über `rolle_berechtigung` /
  `benutzer_rolle`), KioskGeraet
- Bootstrap/Login/Refresh (`/auth/*`), argon2id-Passwort-Hashing
- RBAC-Grundmodell: 5 System-Rollen (siehe docs/rbac-rollenkatalog.md),
  Berechtigungen werden beim Login/Refresh ins JWT gepackt
  (`modulKey:aktion`-Format)
- Generischer Audit-Log-Trigger auf `benutzer`, `rolle`, `berechtigung`,
  `kiosk_geraet`
- **Kiosk-Login für Zeiterfassung** (`/auth/kiosk/*`): Mitarbeiter ohne vollen
  ERP-Zugang (z. B. Werkstatt-Personal) können sich an einem Wandtablet per
  Personalnummer + 4-stelligem PIN identifizieren, statt E-Mail+Passwort.
  Wiederverwendet die bestehende JWT-/RBAC-Infrastruktur vollständig - kein
  Sondermechanismus: welche Rechte der ausgestellte Token trägt, hängt
  ausschließlich davon ab, welche Rolle(n) der Benutzer normal zugewiesen hat
  (z. B. nur `aussendienst` für reines Stempeln). Tablets authentifizieren sich
  zusätzlich mit einem eigenen Geräte-API-Key (`kiosk_geraet`-Tabelle) als
  Basisschutz gegen PIN-Brute-Force.

## Bekannte Einschränkungen (bewusst, nicht vergessen)

- RFID-Feld (`benutzer.rfid_uid`) ist im Schema vorbereitet, aber die
  Hardware-Anbindung (Kartenleser am Tablet) ist noch nicht gebaut - keine
  Testhardware verfügbar, PIN-Eingabe ist der vollständig getestete Weg
- Keine echte Benutzerverwaltung (Administrator legt Benutzer/PINs an) -
  `BenutzerModule` ist weiterhin ein leerer Stub
- Kiosk-Geräte-Verwaltung hängt aktuell an `zeiterfassung:administrieren`
  statt einer eigenen Berechtigung - wird überarbeitet, sobald es ein echtes
  Modul für System-/Geräteverwaltung gibt
- REVOKE auf `audit_log` wirkt nicht gegen den aktuell genutzten DB-Owner-User
  (eigene eingeschränkte DB-Rolle noch zu schaffen, siehe architecture.md)
- `libs/common`-Code hier unter `src/common/` dupliziert (Docker-Build-Context-Grund)
