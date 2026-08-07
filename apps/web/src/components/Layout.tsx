import { NavLink, Outlet } from 'react-router-dom';
import { Package, Users, Truck, Warehouse, ShoppingCart, Tags, LogOut } from 'lucide-react';
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
  // Naechste Gruppe folgt hier, z.B.:
  // { titel: 'Zeiterfassung & Projekte', items: [...] },
];

export function Layout() {
  const user = getCurrentUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold">WälderBytes ERP</span>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {navigationGruppen.map((gruppe) => (
            <div key={gruppe.titel}>
              <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {gruppe.titel}
              </div>
              <div className="space-y-1">
                {gruppe.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 truncate text-xs text-muted-foreground">{user?.email}</div>
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
