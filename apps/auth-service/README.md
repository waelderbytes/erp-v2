# auth-service

Eigener JWT-Auth-Service (Passport.js), pro Tenant-Deployment eigenstaendig gegen die
Tenant-DB. Kein zentraler IdP (siehe docs/architecture.md Abschnitt 1).

Stand: Grundgeruest/Platzhalter. Naechste Schritte (noch nicht implementiert):
- users/rolle/berechtigung/rolle_berechtigung/benutzer_rolle Migrationen
  (siehe docs/rbac-rollenkatalog.md)
- Login-/Refresh-Token-Endpoints
- JWT-Guard fuer die anderen Services (liest modul_key+aktion aus dem Endpoint-Decorator)
