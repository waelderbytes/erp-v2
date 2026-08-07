import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Generisches Such-/Anlegen-Dropdown, 1:1 nach dem Vorbild aus ERP v1
// (waelderbytes-suite, components/desktop/SearchCreateDropdown.tsx) - dort
// bewusst bereits domainfrei gehalten und fuer alle Dropdowns vorgesehen
// ("das können wir für alle dropdowns natürlich anwenden", Kundenzitat).
// Tippen filtert die vorhandenen Eintraege, Klick auf einen Treffer waehlt
// ihn aus. Erzeugen/Deaktivieren macht NICHT diese Komponente selbst (kein
// API-Wissen hier) - onCreateRequest/onDeactivate kommen vom Aufrufer, der
// danach selbst options/value aktualisiert.
export type SearchCreateOption = {
  id: string;
  label: string;
};

export function SearchCreateDropdown({
  value,
  options,
  placeholder,
  onSelect,
  onCreateRequest,
  onDeactivate,
  disabled = false,
  className,
}: {
  value: string | null;
  options: SearchCreateOption[];
  placeholder?: string;
  onSelect: (id: string | null) => void;
  onCreateRequest?: (eingabe: string) => void;
  onDeactivate?: (id: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const ausgewaehlt = options.find((o) => o.id === value) ?? null;

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilterText('');
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const anzeigeWert = open ? filterText : ausgewaehlt?.label ?? '';
  const suchtext = filterText.trim().toLowerCase();
  const treffer = options.filter((o) => o.label.toLowerCase().includes(suchtext));
  const exakterTreffer = options.some((o) => o.label.toLowerCase() === suchtext);

  function auswaehlen(option: SearchCreateOption) {
    onSelect(option.id);
    setOpen(false);
    setFilterText('');
  }

  function anlegen() {
    if (!filterText.trim() || !onCreateRequest) return;
    onCreateRequest(filterText.trim());
    setOpen(false);
    setFilterText('');
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input
        type="text"
        disabled={disabled}
        value={anzeigeWert}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setFilterText(ausgewaehlt?.label ?? '');
        }}
        onChange={(e) => setFilterText(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border border-border bg-popover bg-background text-foreground shadow-md">
          {ausgewaehlt && (
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setOpen(false);
                setFilterText('');
              }}
              className="block w-full px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent"
            >
              Auswahl entfernen
            </button>
          )}
          {treffer.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between px-2 py-1.5 text-sm hover:bg-accent"
            >
              <button type="button" onClick={() => auswaehlen(option)} className="flex-1 truncate text-left">
                {option.label}
              </button>
              {onDeactivate && (
                <button
                  type="button"
                  title="Aus Auswahl entfernen"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivate(option.id);
                  }}
                  className="ml-2 shrink-0 px-1 text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {treffer.length === 0 && <p className="px-2 py-1.5 text-xs text-muted-foreground">Keine Treffer.</p>}
          {onCreateRequest && filterText.trim() && !exakterTreffer && (
            <button
              type="button"
              onClick={anlegen}
              className="block w-full border-t border-border px-2 py-1.5 text-left text-xs text-primary hover:bg-accent"
            >
              + „{filterText.trim()}“ anlegen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
