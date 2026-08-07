import { NavLink, Outlet } from 'react-router-dom';
import { Package, Users, Truck, Warehouse, ShoppingCart, Tags, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser, logout } from '@/lib/auth';

const navigation = [
  { to: '/artikel', label: 'Artikel', icon: Package },
  { to: '/kunden', label: 'Kunden', icon: Users },
  { to: '/lieferanten', label: 'Lieferanten', icon: Truck },
  { to: '/lager', label: 'Lager', icon: Warehouse },
  { to: '/bestellungen', label: 'Bestellungen', icon: ShoppingCart },
  { to: '/preise', label: 'Preise', icon: Tags },
];

export function Layout() {
  const user = getCurrentUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold">WälderBytes ERP</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map(({ to, label, icon: Icon }) => (
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
