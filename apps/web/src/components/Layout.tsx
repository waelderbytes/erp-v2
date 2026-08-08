import { NavLink, Outlet } from 'react-router-dom';
import { Package, Users, Truck, Warehouse, ShoppingCart, Tags, LogOut, Clock, UserCog, Settings, FileText, ClipboardCheck, PackageCheck, Receipt, FileClock, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, logout } from '@/lib/auth';

// Navigation ist in benannte Gruppen (Modul-Phasen) unterteilt, nicht eine flache
// Liste - macht sichtbar, was zu Warenwirtschaft (Phase 1, fertig) gehoert vs.
// spaeter dazukommende Bereiche (Zeiterfassung/Projekte = Phase 2, Verkauf =
// Phase 3, siehe docs/module-uebersicht.md). Neue Phase = neue Gruppe hier
// ergaenzen, nicht die bestehende Liste umsortieren.
interface NavItem {
  to: string;
  label: string;
  icon: typeof Package;
  // Clientseitige UX-Verbesserung, KEINE Sicherheitsgrenze - die eigentliche
  // Durchsetzung passiert serverseitig per RbacGuard (Benutzerverwaltung ist
  // exklusiv Owner/Administrator vorbehalten, siehe auth-service Migration
  // 0003). Ohne dieses Flag wuerde z.B. ein Sachbearbeiter den Menuepunkt
  // sehen und beim Klick nur ein verwirrendes 403 bekommen.
  nurAdmin?: boolean;
}

interface NavGroup {
  titel: string;
  items: NavItem[];
}

const navigationGruppen: NavGroup[] = [
  {
    titel: 'Warenwirtschaft',
    items: [
      { to: '/artikel', label: 'Artikel', icon: Package },
      { to: '/kunden', label: 'Kunden', icon: Users },
      { to: '/lieferanten', label: 'Lieferanten', icon: Truck },
      { to: '/lager', label: 'Lager', icon: Warehouse },
      { to: '/bestellungen', label: 'Bestellungen', icon: ShoppingCart },
      { to: '/preise', label: 'Preise', icon: Tags },
    ],
  },
  {
    // Modul Belegkette (08.08.2026, siehe module-uebersicht.md) - eigene
    // modul_key 'verkauf'-Berechtigung im Backend, hier nur Navigation.
    titel: 'Vertrieb',
    items: [
      { to: '/angebote', label: 'Angebote', icon: FileText },
      { to: '/auftraege', label: 'Aufträge', icon: ClipboardCheck },
      { to: '/lieferscheine', label: 'Lieferscheine', icon: PackageCheck },
      { to: '/rechnungen', label: 'Rechnungen', icon: Receipt },
      // Zusatzbelege (08.08.2026, Kundenforderung) - entstehen aus einer
      // Auftragsbestaetigung, siehe BELEG_ZUSATZ_TYPEN in beleg-labels.ts.
      { to: '/proformarechnungen', label: 'Proformarechnungen', icon: FileClock },
      { to: '/abschlagsrechnungen', label: 'Abschlagsrechnungen', icon: Banknote },
    ],
  },
  {
    titel: 'Zeiterfassung',
    items: [{ to: '/zeiterfassung', label: 'Meine Zeiterfassung', icon: Clock }],
  },
  {
    titel: 'Verwaltung',
    items: [
      { to: '/benutzer', label: 'Benutzer', icon: UserCog, nurAdmin: true },
      // Stammdaten (Firma/Steuersaetze/Nummernkreise) ist RBAC-seitig ueber
      // den eigenen modul_key 'stammdaten' geschuetzt, der standardmaessig
      // niemandem ausser Owner/Administrator zugeteilt ist (siehe
      // steuersatz.controller.ts) - nurAdmin hier ist rein die UX-Spiegelung
      // davon, keine eigene Sicherheitsgrenze.
      { to: '/stammdaten', label: 'Stammdaten', icon: Settings, nurAdmin: true },
    ],
  },
  // Naechste Gruppe folgt hier, z.B. "Projekte" (Phase 2).
];

export function Layout() {
  const user = getCurrentUser();
  const istAdmin = user?.rollen.includes('owner') || user?.rollen.includes('administrator');

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        {/* Markenblock: Eyebrow + grosser Produktname + kleine Subline -
            Anlehnung an Referenzbilder (08.08.2026), keine Farbaenderung. */}
        <div className="border-b border-border px-4 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            ERP System
          </div>
          <div className="text-lg font-bold leading-tight text-primary">WälderBytes ERP</div>
          <div className="text-xs text-muted-foreground">Warenwirtschaft</div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {navigationGruppen.map((gruppe) => {
            const sichtbareItems = gruppe.items.filter((item) => !item.nurAdmin || istAdmin);
            if (sichtbareItems.length === 0) return null;
            return (
            <div key={gruppe.titel}>
              <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {gruppe.titel}
              </div>
              <div className="space-y-1">
                {sichtbareItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'border-l-primary bg-primary text-primary-foreground'
                          : 'border-l-transparent text-foreground/80 hover:bg-accent hover:text-accent-foreground',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2">
            <div className="truncate text-sm font-semibold">{user?.email}</div>
            {user?.rollen[0] && (
              <div className="truncate text-xs capitalize text-muted-foreground">{user.rollen[0]}</div>
            )}
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  );
}
