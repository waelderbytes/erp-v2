# web

React-Frontend (PWA, mobile-first geplant - PWA-Manifest/Service-Worker folgt,
siehe Offene Punkte unten). UI-Bibliothek: **shadcn/ui + Tailwind**
(Nutzerentscheidung 08.08.2026, siehe docs/module-uebersicht.md) - Komponenten
liegen unter `src/components/ui/` als eigener Code (nicht als npm-Paket, das ist
bei shadcn so vorgesehen), Farben ausschließlich über CSS-Variablen in
`src/index.css` (Theming-Grundlage fuer spaeteres White-Label).

## Enthält

- Routing: React Router, `/login` öffentlich, alle anderen Routen hinter
  `RequireAuth` (prüft nur clientseitig auf ein nicht abgelaufenes Access-Token -
  echte Autorisierung passiert weiterhin ausschließlich im Backend/RBAC)
- Auth: `src/lib/auth.ts` - Login, Logout, Access-/Refresh-Token in `localStorage`,
  automatischer Refresh-Versuch bei 401 (`src/lib/api.ts`) bevor ausgeloggt wird
- API-Client: `src/lib/api.ts`, zentraler fetch-Wrapper gegen `/api/*`
- Screens (Liste + Anlegen, kein Update/Löschen - konsistent mit dem
  Backend-MVP-Scope): Artikel, Kunden, Lieferanten, Lager (inkl.
  Wareneingang/Warenausgang buchen + Bestandsanzeige), Bestellungen (inkl.
  Bestellen-Aktion + Wareneingang je Position), Preise (inkl. "Preis ermitteln"-
  Testwerkzeug)

## Routing zum Backend (wichtiger technischer Zwischenschritt)

`api-gateway` ist aktuell noch ein leerer Stub (siehe
`apps/api-gateway/src/app.module.ts`) - kein echtes Gateway mit
Auth-Vorprüfung/Rate-Limiting, wie in docs/architecture.md vorgesehen. Damit die
UI trotzdem funktioniert, übernimmt vorübergehend **nginx** (`nginx.conf`) das
Routing: `/api/auth/*` → `auth-service`, alles andere unter `/api/*` →
`erp-service`. Für die lokale Entwicklung (`npm run dev`) übernimmt das
äquivalent der Vite-Dev-Server-Proxy in `vite.config.ts`.

**Technische Schuld, bewusst dokumentiert:** Ein echtes `api-gateway` (Auth-Check
VOR dem Fach-Service, Rate-Limiting, einheitliches Fehlerformat) sollte
nachgezogen werden, bevor mehrere Tenants produktiv laufen - aktuell prüft jeder
Fach-Service seinen JWT selbst (funktioniert, ist aber nicht die im
Architektur-Dokument vorgesehene Aufteilung).

## Bekannte Einschränkungen (bewusst, nicht vergessen)

- Kein Update/Löschen in der UI (Backend hat es für die meisten Entitäten auch
  noch nicht)
- Access-/Refresh-Token in `localStorage` statt httpOnly-Cookies - einfacher für
  den MVP, aber XSS-anfälliger. Vor Produktivbetrieb mit echten Kundendaten
  nochmal bewerten.
- Kein OpenAPI-Codegen für die TS-Typen (`src/lib/types.ts` ist manuell gegen die
  Backend-Entities synchron gehalten) - Automatisierung ist ein späterer
  Ausbauschritt
- Theme-Auswahl (hell/dunkel/Farbschema) ist als CSS-Variablen-Mechanismus
  vorbereitet, aber noch keine Auswahl-UI gebaut - kommt zusammen mit
  Firmendaten/Benutzerprofil (nächster Schritt laut Nutzer)
- PWA-Manifest/Service-Worker (`vite-plugin-pwa`) noch nicht aktiviert - fehlendes
  Icon-Set, folgt mit dem nächsten UI-Schritt
- Kein Router-Guard für RBAC-Berechtigungen (z. B. Navigationspunkt ausblenden,
  wenn Benutzer keine Leserechte hat) - aktuell sehen alle angemeldeten Benutzer
  alle Navigationspunkte, das Backend blockt aber weiterhin serverseitig korrekt
