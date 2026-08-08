// Nutzerwunsch 08.08.2026: bei aktivem Backend-Debug-Modus (ENV
// DEBUG_ERRORS=true, siehe all-exceptions.filter.ts) sollen Fehlerdetails
// direkt auf der Seite sichtbar sein, ohne extra in die Browser-Konsole
// oder das Server-Log schauen zu muessen. Ersetzt schrittweise die bisher
// verstreuten "<p className='text-destructive'>{fehler}</p>"-Stellen -
// nimmt den rohen Fehler (nicht schon die extrahierte Nachricht) entgegen,
// damit debugStack (falls vorhanden) mit angezeigt werden kann.
import { ApiError } from '@/lib/api';

export function FehlerAnzeige({ error, fallback }: { error: unknown; fallback: string }) {
  if (!error) return null;
  const nachricht = error instanceof ApiError ? error.message : error instanceof Error ? error.message : fallback;
  const stack = error instanceof ApiError ? error.debugStack : undefined;

  return (
    <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm text-destructive">
        {error instanceof ApiError && error.status >= 500 ? 'Interner Serverfehler – ' : ''}
        {nachricht}
      </p>
      {stack && stack.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Details zum Fehler (Debug-Modus)</summary>
          <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-[11px]">
            {error instanceof ApiError && error.debugName ? `${error.debugName}\n` : ''}
            {stack.join('\n')}
          </pre>
        </details>
      )}
    </div>
  );
}
